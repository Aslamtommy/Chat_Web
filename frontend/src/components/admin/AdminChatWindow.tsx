// AdminChatWindow.tsx
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
}

interface AdminChatWindowProps {
  userId: string | null;
  username?: string | null;
  socket: any;
  isMobile: boolean;
}

const AdminChatWindow = ({ userId, username, socket, isMobile }: AdminChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminId = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    adminId.current = decoded.id;

    socket.on('newMessage', (message: Message) => {
      if (message.senderId === userId || (message.isAdmin && message.chatId === userId)) {
        setMessages((prev) => [...prev, { ...message, status: 'delivered' }]);
        scrollToBottom();
      }
    });

    return () => socket.off('newMessage');
  }, [userId, socket, scrollToBottom]);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      return;
    }
    const fetchChatHistory = async () => {
      const chat = await adminService.getUserChatHistory(userId);
      setMessages(chat.messages.map((msg: any) => ({
        _id: msg._id.toString(),
        content: msg.content,
        isAdmin: msg.sender_id.toString() !== chat.user_id.toString(),
        messageType: msg.message_type,
        status: 'delivered',
        senderId: msg.sender_id.toString(),
        chatId: chat._id.toString(),
      })));
      scrollToBottom();
    };
    fetchChatHistory();
  }, [userId, scrollToBottom]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice', content: string | File) => {
      if (!userId || !adminId.current) return;
      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? content as string : 'Uploading...',
        isAdmin: true,
        messageType,
        status: 'sending',
        senderId: adminId.current,
        chatId: userId,
      };
      setMessages((prev) => [...prev, tempMessage]);
      const response = await adminService.sendMessageToUser(userId, messageType, content);
      const savedMessage = response.messages[response.messages.length - 1];
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, _id: savedMessage._id, content: savedMessage.content, status: 'delivered' } : msg
        )
      );
      scrollToBottom();
    },
    [userId]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-sm">
      {userId ? (
        <>
          <div className="p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <span className="text-sm font-medium text-amber-500">
                  {username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-medium text-white">{username || 'User'}</h3>
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
          <p className="text-white/70 text-lg">
            {isMobile ? 'Select a user to start chatting' : 'No user selected'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;