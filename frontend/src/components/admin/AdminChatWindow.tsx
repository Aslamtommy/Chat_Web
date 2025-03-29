import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';

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
  socket:any ;
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
      console.log('Received newMessage:', message);
      if (message.senderId === userId || (message.isAdmin && message.chatId === userId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, { ...message, status: 'delivered' }];
        });
        scrollToBottom();
      }
    };

    const handleMessageDelivered = (message: Message) => {
      console.log('Received messageDelivered:', message);
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
        let finalContent = content;
        if (messageType !== 'text') {
          const response = await adminService.sendMessageToUser(userId, messageType, content);
          finalContent = response.messages[response.messages.length - 1].content;
        }

        socket.emit(
          'sendMessage',
          { targetUserId: userId, messageType, content: finalContent, tempId },
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
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {userId ? (
        <>
          <div className="p-4 bg-white border-b border-gray-200">
            <h3 className="text-lg font-semibold">Chat with {username || 'User'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
            <ChatList messages={messages} />
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSend={handleSend} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;