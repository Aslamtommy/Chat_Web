import { useState, useEffect, useRef, useCallback } from 'react';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  senderId: string;
  chatId?: string;
  duration?: number;
  timestamp?: string;
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
  const adminId = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Mark messages as read function
  const markMessagesAsRead = useCallback(() => {
    if (userId && socket) {
      adminService.markMessagesAsRead(userId)
        .then(() => {
          socket.emit('markMessagesAsRead', { chatId: userId });
          socket.emit('syncUnreadCounts'); // Ensure sidebar updates immediately
        })
        .catch((error) => console.error('Failed to mark messages as read:', error));
    }
  }, [userId, socket]);

  // Initial load and setup
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) {
      setMessages([]);
      return;
    }

    const decoded = JSON.parse(atob(token.split('.')[1]));
    adminId.current = decoded.id;

    const fetchChatHistory = async () => {
      try {
        const chat = await adminService.getUserChatHistory(userId);
        const formattedMessages: Message[] = chat.messages.map((msg: any) => ({
          _id: msg._id.toString(),
          content: msg.content,
          isSelf: msg.sender_id.toString() === adminId.current,
          messageType: msg.message_type || 'text',
          status: 'delivered' as const,
          senderId: msg.sender_id.toString(),
          chatId: chat._id.toString(),
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        setTimeout(() => scrollToBottom(), 0);
        markMessagesAsRead(); // Mark all messages as read on load
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchChatHistory();

    const handleNewMessage = (message: Message) => {
      if (message.chatId === userId || message.senderId === userId) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            status: 'delivered' as const,
            isSelf: message.senderId === adminId.current,
          },
        ]);
        setTimeout(() => scrollToBottom(), 0);
        // Mark as read if it's not from the admin
        if (!message.isSelf) {
          markMessagesAsRead();
        }
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [userId, socket, scrollToBottom, markMessagesAsRead]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice', content: string | File) => {
      if (!userId || !adminId.current) return;

      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isSelf: true,
        messageType,
        status: 'sending',
        senderId: adminId.current,
        chatId: userId,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, tempMessage];
        setTimeout(() => scrollToBottom(), 0);
        return updatedMessages;
      });

      try {
        const response = await adminService.sendMessageToUser(userId, messageType, content);
        const savedMessage = response.messages[response.messages.length - 1];
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg._id === tempId
              ? {
                  ...msg,
                  _id: savedMessage._id.toString(),
                  content: savedMessage.content,
                  status: 'delivered' as const,
                  timestamp: savedMessage.timestamp,
                }
              : msg
          );
          setTimeout(() => scrollToBottom(), 0);
          return updatedMessages;
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
      }
    },
    [userId, scrollToBottom]
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