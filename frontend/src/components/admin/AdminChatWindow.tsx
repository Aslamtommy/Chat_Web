import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';

interface Message {
  _id: string;
  content: string;
  isAdmin: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
}

interface AdminChatWindowProps {
  userId: string | null;
  username?: string | null;
}

const AdminChatWindow = ({ userId, username }: AdminChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const pendingMessages = useRef<Set<string>>(new Set());

  // Smooth Scrolling
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Socket Event Handlers
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id && m.timestamp === message.timestamp)) {
        return prev;
      }
      return [...prev, { ...message, status: 'delivered' }];
    });
    scrollToBottom();
  }, [scrollToBottom]);

  const handleMessageDelivered = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === message._id ? { ...msg, status: 'delivered' } : msg
      )
    );
  }, []);

  const handleMessageError = useCallback(
    ({ tempId, error }: { tempId: string; error: string }) => {
      console.error('Message error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      pendingMessages.current.delete(tempId);
    },
    []
  );

  // Establishing Socket Connection
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) return;

    socketRef.current = io('https://chat-web-1ud8.onrender.com', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server as admin');
    });

    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('messageDelivered', handleMessageDelivered);
    socketRef.current.on('messageError', handleMessageError);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, handleNewMessage, handleMessageDelivered, handleMessageError]);

  // Fetch Chat History
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
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChatHistory();
  }, [userId, scrollToBottom]);

  // Handle Message Sending
  const handleSend = useCallback(
    async (
      messageType: 'text' | 'image' | 'voice',
      content: string | File,
      duration?: number
    ) => {
      if (!userId || !socketRef.current) return;

      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isAdmin: true,
        messageType,
        status: 'sending',
        duration,
        timestamp: new Date().toISOString(),
      };

      pendingMessages.current.add(tempId);
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      try {
        let finalContent = content;
        if (messageType !== 'text') {
          const response = await adminService.sendMessageToUser(userId, messageType, content);
          finalContent = response.messages[response.messages.length - 1].content;
        }

        socketRef.current.emit(
          'sendMessage',
          {
            targetUserId: userId,
            messageType,
            content: finalContent,
            tempId,
          },
          (ack: { status: string; message?: Message }) => {
            pendingMessages.current.delete(tempId);

            if (ack?.status === 'success' && ack.message) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempId
                    ? {
                        ...msg,
                        _id: ack.message!._id,
                        content: ack.message!.content,
                        status: 'delivered',
                        timestamp: ack.message!.timestamp,
                      }
                    : msg
                )
              );
            }
          }
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...msg, status: 'failed' } : msg
          )
        );
        pendingMessages.current.delete(tempId);
      }
    },
    [userId, scrollToBottom]
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-bg">
      {userId ? (
        <>
          {/* Header */}
          <div className="p-4 bg-header-bg text-text-primary shadow-md border-b border-gray-300 flex items-center justify-between">
            <h3 className="text-lg font-semibold truncate">
              Chat with {username || 'User'}
            </h3>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
            <ChatList messages={messages} />
          </div>

          {/* Chat Input */}
          <div className="border-t bg-gray-50 p-4 shadow-inner">
            <ChatInput onSend={handleSend} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <p className="text-gray-600 text-lg">Select a user to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;
