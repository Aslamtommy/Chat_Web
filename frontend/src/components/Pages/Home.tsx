import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ChatHeader from '../chat/ChatHeader';
import ChatList from '../chat/ChatList';
import ChatInput from '../chat/ChatInput';
import chatService from '../Services/chatService';
import ProfileModal from '../Modal/ProfileModal';
import { motion } from 'framer-motion';
import { DollarSign, X, Upload } from 'lucide-react';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'screenshot';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  duration?: number;
  timestamp?: string;
  senderId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface PaymentDetails {
  accountNumber: string;
  ifscCode: string;
  amount: string;
  name: string;
  upiId: string;
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'files' | 'profile'>('chats');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [screenshotRequested, setScreenshotRequested] = useState(() => {
    return localStorage.getItem('screenshotRequested') === 'true';
  });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(() => {
    const stored = localStorage.getItem('paymentDetails');
    return stored ? JSON.parse(stored) : null;
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();
  const pendingMessages = useRef<Set<string>>(new Set());
  const userId = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('screenshotRequested', screenshotRequested.toString());
    localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
  }, [screenshotRequested, paymentDetails]);

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
      console.log('Socket connected, userId:', userId.current);
    });

    socketRef.current.on('newMessage', handleNewMessage);

    socketRef.current.on('screenshotRequested', (data: { userId: string; paymentDetails: PaymentDetails }) => {
      console.log('Received screenshotRequested:', data);
      if (data.userId === userId.current) {
        setScreenshotRequested(true);
        setPaymentDetails(data.paymentDetails);
      } else {
        console.log('User ID mismatch:', data.userId, '!=', userId.current);
      }
    });

    socketRef.current.on('screenshotFulfilled', () => {
      console.log('Screenshot fulfilled received');
      setScreenshotRequested(false);
      setPaymentDetails(null);
      localStorage.removeItem('screenshotRequested');
      localStorage.removeItem('paymentDetails');
    });

    socketRef.current.on('messageEdited', (updatedMessage: { _id: string; content: string; isEdited: boolean }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        )
      );
    });

    socketRef.current.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
      );
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
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
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
            };
          })
          .filter((msg: any): msg is Message => msg !== null)
          .sort((a: any, b: any) =>
            new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
          );

        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 0);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice' | 'screenshot', content: string | File, duration?: number) => {
      if (!socketRef.current || !userId.current) return;

      const tempId = Date.now().toString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isSelf: true,
        messageType,
        status: 'sending',
        senderId: userId.current,
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
                  status: 'delivered' as const,
                  senderId: userId.current,
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

  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleEditSave = (messageId: string) => {
    chatService
      .editMessage(messageId, editedContent)
      .then(() => {
        socketRef.current.emit('editMessage', { messageId, content: editedContent });
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, content: editedContent, isEdited: true } : msg
          )
        );
        setEditingMessageId(null);
        setEditedContent('');
      })
      .catch((error) => console.error('Failed to edit message:', error));
  };

  const handleDelete = (messageId: string) => {
    chatService
      .deleteMessage(messageId)
      .then(() => {
        socketRef.current.emit('deleteMessage', { messageId });
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
        );
      })
      .catch((error) => console.error('Failed to delete message:', error));
  };

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
              <ChatList
                messages={messages}
                editingMessageId={editingMessageId}
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                onEditStart={handleEditStart}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingMessageId(null)}
                onDelete={handleDelete}
              />
            </div>
            <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-md px-2 sm:px-4 py-2">
              <ChatInput onSend={handleSend} />
              {screenshotRequested && paymentDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute bottom-16 left-0 right-0 mx-4 bg-gray-900 rounded-lg shadow-2xl border border-gray-700/50 max-w-md p-4 z-10 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <h4 className="text-lg font-semibold text-white">Payment Request</h4>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setScreenshotRequested(false);
                        setPaymentDetails(null);
                        localStorage.removeItem('screenshotRequested');
                        localStorage.removeItem('paymentDetails');
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <div className="bg-gray-800/50 rounded-md p-3 space-y-2 text-sm text-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">Account Number:</span>
                      <span>{paymentDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">IFSC Code:</span>
                      <span>{paymentDetails.ifscCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">Amount:</span>
                      <span className="text-amber-400 font-semibold">₹{paymentDetails.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">Name:</span>
                      <span>{paymentDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">UPI ID:</span>
                      <span>{paymentDetails.upiId}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleScreenshotUpload}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-medium text-sm shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Payment Proof</span>
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