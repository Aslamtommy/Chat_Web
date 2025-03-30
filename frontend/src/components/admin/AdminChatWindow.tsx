import { useState, useEffect, useRef, useCallback } from 'react';
 
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import AdminUserDetails from './AdminUserDetails';

interface Message {
  _id: string;
  content: string;
  isAdmin: boolean;
  messageType: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  senderId: string;
  chatId: string;
  duration?: number;
  timestamp?: string;
}

interface AdminChatWindowProps {
  userId: string | null;
  username?: string | null;
  socket: any;
}

const AdminChatWindow = ({ userId, username, socket }: AdminChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const adminId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
 

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) return;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      adminId.current = decoded.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return;
    }

    const handleNewMessage = (message: Message) => {
      if (message.senderId === userId || (message.isAdmin && message.chatId === userId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, { ...message, status: 'delivered' }];
        });
        scrollToBottom();
      }
    };

    const handleMessageDelivered = (message: Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? { ...msg, status: 'delivered' } : msg))
      );
    };

    const handleMessageError = ({ tempId, error }: { tempId: string; error: string }) => {
      console.error('Message error:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageError', handleMessageError);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageError', handleMessageError);
    };
  }, [userId, socket, scrollToBottom]);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const chat = await adminService.getUserChatHistory(userId);
        const formattedMessages: Message[] = chat.messages.map((msg: any) => ({
          _id: msg._id.toString(),
          content: msg.content,
          isAdmin: msg.sender_id.toString() !== chat.user_id.toString(),
          messageType: msg.message_type,
          status: 'delivered',
          senderId: msg.sender_id.toString(),
          chatId: chat._id.toString(),
          timestamp: msg.timestamp,
          duration: msg.duration,
        }));
        setMessages(formattedMessages);
        setTimeout(() => scrollToBottom('auto'), 100);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChatHistory();
  }, [userId, scrollToBottom]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice', content: string | File, duration?: number) => {
      if (!userId || !socket || !adminId.current) return;

      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isAdmin: true,
        messageType,
        status: 'sending',
        senderId: adminId.current,
        chatId: userId,
        duration,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      try {
        if (messageType !== 'text') {
          // Handle non-text messages via HTTP
          const response = await adminService.sendMessageToUser(userId, messageType, content);
          const savedMessage = response.messages[response.messages.length - 1];
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? {
                    _id: savedMessage._id.toString(),
                    content: savedMessage.content,
                    isAdmin: true,
                    messageType: savedMessage.message_type,
                    status: 'delivered',
                    senderId: adminId.current!,
                    chatId: userId,
                    duration: savedMessage.duration || duration,
                    timestamp: savedMessage.timestamp,
                  }
                : msg
            )
          );
        } else {
          // Handle text messages via Socket.io
          socket.emit(
            'sendMessage',
            { targetUserId: userId, messageType, content: content as string, tempId },
            (ack: { status: string; message?: Message }) => {
              if (ack?.status === 'success' && ack.message) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId ? { ...msg, ...ack.message, status: 'delivered' } : msg
                  )
                );
              }
            }
          );
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
      }
    },
    [userId, socket]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-sm">
      {userId ? (
        <>
          <div className="p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                  <span className="text-sm font-medium text-amber-500">
                    {username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-medium text-white">{username || 'User'}</h3>
              </div>
              <div className="md:hidden">
                <AdminUserDetails userId={userId} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
            <ChatList messages={messages} />
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <ChatInput onSend={handleSend} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-white/70 text-lg">Select a user to start chatting</p>
            <p className="text-amber-500/60 text-sm">Choose from the sidebar to begin conversation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;