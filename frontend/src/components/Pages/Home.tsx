import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import ChatInput from '../chat/ChatInput';
import chatService from '../Services/chatService';
import ProfileModal from '../Modal/ProfileModal';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

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
  const [screenshotRequested, setScreenshotRequested] = useState(() => {
    return localStorage.getItem('screenshotRequested') === 'true';
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();
  const pendingMessages = useRef<Set<string>>(new Set());
  const userId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('screenshotRequested', screenshotRequested.toString());
  }, [screenshotRequested]);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.senderId === userId.current) return;

    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      const newMessage = { ...message, isSelf: false, status: 'delivered' as const };
      return [...prev, newMessage];
    });
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      const decoded = jwtDecode<{ id: string }>(token);
      userId.current = decoded.id;
    });

    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('screenshotRequested', () => setScreenshotRequested(true));
    socketRef.current.on('screenshotFulfilled', () => {
      setScreenshotRequested(false);
      localStorage.removeItem('screenshotRequested');
    });

    const fetchChatHistory = async () => {
      try {
        const chat = await chatService.getChatHistory();
        if (!chat || !chat.messages) {
          console.log('No chat history found');
          setMessages([]);
          return;
        }

        const formattedMessages: Message[] = chat.messages
          .map((msg: any) => {
            if (!msg || !msg._id || !msg.sender_id) {
              console.warn('Invalid message format:', msg);
              return null;
            }
            return {
              _id: msg._id.toString(),
              content: msg.content || '',
              isSelf: msg.sender_id.toString() === userId.current,
              messageType: msg.message_type || 'text',
              status: 'delivered' as const,
              senderId: msg.sender_id.toString(),
              timestamp: msg.timestamp || new Date().toISOString(),
            };
          })
          .filter((msg: any): msg is Message => msg !== null)
          .sort((a:any, b:any) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());

        setMessages(formattedMessages);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([]);
      }
    };
    fetchChatHistory();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [navigate, handleNewMessage, scrollToBottom]);

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
        const serviceMessageType = messageType === 'screenshot' ? 'image' : messageType;
        const response = await chatService.sendMessage(serviceMessageType, content);
        const savedMessage = response.messages[response.messages.length - 1];

        if (messageType === 'screenshot') {
          socketRef.current.emit('screenshotUploaded', {
            userId: userId.current,
            messageId: savedMessage._id,
          });
        }

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
    fileInputRef.current?.click();
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-black font-serif">
      <ChatHeader onProfileClick={() => setIsProfileModalOpen(true)} />
      <div className="flex-1 flex flex-col mx-1 sm:mx-4 mb-2 sm:mb-4 mt-1 sm:mt-2 overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
        {activeTab === 'chats' && (
          <>
            <div
              className="flex-1 overflow-y-auto bg-gradient-to-b from-black/40 to-black/20 px-2 sm:px-6"
              ref={chatContainerRef}
            >
              <ChatList messages={messages} />
            </div>
            <div className="border-t border-white/10 bg-black/30 backdrop-blur-md px-2 sm:px-4 py-2">
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
                    className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center space-x-2 text-sm font-semibold border border-amber-500/20"
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