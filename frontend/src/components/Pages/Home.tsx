// src/components/Pages/Home.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import ChatInput from '../chat/ChatInput';
import chatService from '../Services/chatService';
import io from 'socket.io-client';
import ProfileModal from '../Modal/ProfileModal';

interface Message {
  _id: string;
  content: string;
  isAdmin: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'files' | 'profile'>('chats');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();
  const pendingMessages = useRef<Set<string>>(new Set());

  const isNearBottom = useCallback(() => {
    if (!chatContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages(prev => {
      if (prev.some(m => m._id === message._id && m.timestamp === message.timestamp)) return prev;
      return [...prev, { ...message, status: 'delivered' }];
    });
    if (isNearBottom()) scrollToBottom();
  }, [isNearBottom, scrollToBottom]);

  const handleMessageDelivered = useCallback((message: Message) => {
    setMessages(prev => prev.map(msg => 
      msg._id === message._id ? { ...msg, status: 'delivered' } : msg
    ));
  }, []);

  const handleMessageError = useCallback(({ tempId, error }: { tempId: string, error: string }) => {
    console.error('Message error:', error);
    setMessages(prev => prev.map(msg => 
      msg._id === tempId ? { ...msg, status: 'failed' } : msg
    ));
    pendingMessages.current.delete(tempId);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    socketRef.current = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => console.log('Connected to Socket.IO server'));
    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageDelivered', handleMessageDelivered);
    socketRef.current.on('messageError', handleMessageError);

    const fetchChatHistory = async () => {
      try {
        const chat = await chatService.getChatHistory();
        const formattedMessages: Message[] = chat.messages.map((msg: any) => ({
          _id: msg._id.toString(),
          content: msg.content,
          isAdmin: msg.sender_id.toString() !== chat.user_id.toString(),
          messageType: msg.message_type,
          status: 'delivered',
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChatHistory();

    return () => {
      socketRef.current?.off('newMessage', handleNewMessage);
      socketRef.current?.off('messageDelivered', handleMessageDelivered);
      socketRef.current?.off('messageError', handleMessageError);
      socketRef.current?.disconnect();
    };
  }, [navigate, handleNewMessage, handleMessageDelivered, handleMessageError, scrollToBottom]);

  const handleSend = useCallback(async (
    messageType: 'text' | 'image' | 'voice',
    content: string | File,
    duration?: number
  ) => {
    if (!socketRef.current) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      _id: tempId,
      content: messageType === 'text' ? (content as string) : 'Uploading...',
      isAdmin: false,
      messageType,
      status: 'sending',
      duration,
      timestamp: new Date().toISOString(),
    };

    pendingMessages.current.add(tempId);
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      let finalContent = content;
      if (messageType !== 'text') {
        const response = await chatService.sendMessage(messageType, content);
        finalContent = response.messages[response.messages.length - 1].content;
      }

      socketRef.current.emit('sendMessage', { messageType, content: finalContent, tempId }, (ack: { status: string, message?: Message }) => {
        pendingMessages.current.delete(tempId);
        if (ack?.status === 'success' && ack.message) {
          setMessages(prev => prev.map(msg =>
            msg._id === tempId ? { ...msg, _id: ack.message!._id, content: ack.message!.content, status: 'delivered', timestamp: ack.message!.timestamp } : msg
          ));
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg => msg._id === tempId ? { ...msg, status: 'failed' } : msg));
      pendingMessages.current.delete(tempId);
    }
  }, [scrollToBottom]);

  const handleTabChange = (tab: 'chats' | 'files' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'profile') setIsProfileModalOpen(true);
    else if (tab === 'files') navigate('/files');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Enhanced Header */}
      <ChatHeader />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white rounded-t-3xl shadow-lg overflow-hidden mx-4 mb-4 mt-2">
        {activeTab === 'chats' && (
          <>
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white" ref={chatContainerRef}>
              <ChatList messages={messages} />
            </div>
            <div className="border-t border-gray-200 bg-white">
              <ChatInput onSend={handleSend} />
            </div>
          </>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => {
          setIsProfileModalOpen(false);
          setActiveTab('chats');
        }} 
      />

      {/* Elegant Bottom Navigation */}
      <div className="flex justify-around py-3 px-6 bg-white border-t border-gray-200 shadow-md rounded-b-xl mx-4 mb-4">
        {[
          { id: 'chats', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Chats' },
          { id: 'files', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Files' },
          { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as 'chats' | 'files' | 'profile')}
            className={`flex flex-col items-center transition-all duration-200 ${
              activeTab === tab.id ? 'text-gray-900 scale-105' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
            </svg>
            <span className="text-xs mt-1 font-medium tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;