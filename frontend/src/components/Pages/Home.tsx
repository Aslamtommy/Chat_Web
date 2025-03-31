import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import ChatInput from '../chat/ChatInput';
import chatService from '../Services/chatService';
import ProfileModal from '../Modal/ProfileModal';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react'; // Adding lucide-react for the icon

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'screenshot';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
  senderId?: string;
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'files' | 'profile'>('chats');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [screenshotRequested, setScreenshotRequested] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();
  const pendingMessages = useRef<Set<string>>(new Set());
  const userId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.senderId === userId.current) return;

    setMessages((prev: Message[]): Message[] => {
      if (prev.some((m) => m._id === message._id)) return prev;
      const newMessage = {
        ...message,
        isSelf: message.senderId === userId.current,
        status: 'delivered' as const,
      };
      const updatedMessages = [...prev, newMessage];
      scrollToBottom();
      return updatedMessages;
    });
  }, [scrollToBottom]);

  const handleMessageDelivered = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === message._id ? { ...msg, ...message, status: 'delivered' } : msg
      )
    );
  }, []);

  const handleMessageError = useCallback(
    ({ tempId, error }: { tempId: string; error: string }) => {
      console.error('Message error:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
      );
      pendingMessages.current.delete(tempId);
    },
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    socketRef.current = io(`http://localhost:5000`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
      const decoded = jwtDecode<{ id: string }>(token);
      userId.current = decoded.id;
    });
    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageDelivered', handleMessageDelivered);
    socketRef.current.on('messageError', handleMessageError);

    socketRef.current.on('screenshotRequested', () => {
      setScreenshotRequested(true);
    });

    const fetchChatHistory = async () => {
      try {
        const chat = await chatService.getChatHistory();
        const formattedMessages: Message[] = chat.messages.map((msg: any) => ({
          _id: msg._id.toString(),
          content: msg.content,
          isSelf: msg.sender_id.toString() === chat.user_id.toString(),
          messageType: msg.message_type,
          status: 'delivered' as const,
          senderId: msg.sender_id.toString(),
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChatHistory();

    return () => {
      socketRef.current?.off('newMessage', handleNewMessage);
      socketRef.current?.off('messageDelivered', handleMessageDelivered);
      socketRef.current?.off('messageError', handleMessageError);
      socketRef.current?.off('screenshotRequested');
      socketRef.current?.disconnect();
    };
  }, [navigate, handleNewMessage, handleMessageDelivered, handleMessageError, scrollToBottom]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice' | 'screenshot', content: string | File, duration?: number) => {
      if (!socketRef.current) return;

      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isSelf: true,
        messageType,
        status: 'sending',
        senderId: userId.current || '',
        duration,
        timestamp: new Date().toISOString(),
      };

      pendingMessages.current.add(tempId);
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      try {
        if (messageType !== 'text') {
          const serviceMessageType = messageType === 'screenshot' ? 'image' : messageType;
          const response = await chatService.sendMessage(serviceMessageType, content);
          const savedMessage = response.messages[response.messages.length - 1];
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? {
                    _id: savedMessage._id.toString(),
                    content: savedMessage.content,
                    isSelf: true,
                    messageType: msg.messageType,
                    status: 'delivered',
                    senderId: userId.current || '',
                    duration: savedMessage.duration || duration,
                    timestamp: savedMessage.timestamp,
                  }
                : msg
            )
          );
          pendingMessages.current.delete(tempId);
          if (messageType === 'screenshot') {
            setScreenshotRequested(false);
          }
        } else {
          socketRef.current.emit(
            'sendMessage',
            { messageType, content: content as string, tempId },
            (ack: { status: string; message?: Message }) => {
              pendingMessages.current.delete(tempId);
              if (ack?.status === 'success' && ack.message) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId
                      ? { ...msg, ...ack.message, status: 'delivered', isSelf: true }
                      : msg
                  )
                );
                scrollToBottom();
              }
            }
          );
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
        pendingMessages.current.delete(tempId);
      }
    },
    [scrollToBottom]
  );

  const handleScreenshotUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      handleSend('screenshot', file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTabChange = (tab: 'chats' | 'files' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'profile') setIsProfileModalOpen(true);
    else if (tab === 'files') navigate('/files');
  };

  return (
    <div className="flex flex-col h-screen bg-black font-serif">
      <ChatHeader />
      <div className="flex-1 flex flex-col mx-4 mb-4 mt-2 overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 relative">
        {activeTab === 'chats' && (
          <>
            <div
              className="flex-1 overflow-y-auto bg-gradient-to-b from-black/40 to-black/20"
              ref={chatContainerRef}
            >
              <ChatList messages={messages} />
            </div>
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-md">
              <ChatInput onSend={handleSend} />
              {screenshotRequested && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 flex justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleScreenshotUpload}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2.5 rounded-xl 
                      shadow-md hover:from-amber-700 hover:to-amber-800 transition-all duration-300 
                      flex items-center space-x-2 text-sm font-semibold border border-amber-500/20"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Upload Payment Screenshot</span>
                  </motion.button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setActiveTab('chats');
        }}
      />
      <div className="mx-4 mb-4">
        <div className="flex justify-around py-3 px-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl">
          {[
            { id: 'chats', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Chats' },
            { id: 'files', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Files' },
            { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'chats' | 'files' | 'profile')}
              className={`flex flex-col items-center transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-amber-500 scale-105'
                  : 'text-white/70 hover:text-amber-500/80'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={tab.icon} />
              </svg>
              <span className="text-xs mt-1.5 font-medium tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function jwtDecode<T>(token: string): T {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export default Home;