import { useState, useEffect, useRef, useCallback } from 'react';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Check, User, ArrowLeft, Image } from 'lucide-react';
import AdminUserDetails from './AdminUserDetails';
import chatService from '../Services/chatService';
import axios from 'axios';
import { openDB, DBSchema,   } from 'idb';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  senderId?: string;
  chatId?: string;
  timestamp?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  duration: any;
}

interface PaymentDetails {
  accountNumber: string;
  ifscCode: string;
  amount: string;
  name: string;
  upiId: string;
}

interface PaymentRequest {
  _id: string;
  userId: { _id: string; username: string };
  paymentDetails: PaymentDetails;
  status: 'pending' | 'uploaded';
  screenshotUrl?: string;
  createdAt: string;
}

interface AdminChatWindowProps {
  userId: string | null;
  username?: string | null;
  socket: any;
  isMobile: boolean;
  onBack?: () => void;
}

// IndexedDB Schema
interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: Message & { userId: string }; // Add userId to differentiate chats
    indexes: { 'timestamp-userId': [string, string] };
  };
}

// IndexedDB Helper Functions
const getDB = async () => {
  return openDB<ChatDB>('admin-chat-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('messages', { keyPath: '_id' });
      store.createIndex('timestamp-userId', ['timestamp', 'userId']);
    },
  });
};

const saveMessages = async (userId: string, messages: Message[]) => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await Promise.all(messages.map((message) => store.put({ ...message, userId })));
  await tx.done;
};

const getMessagesFromDB = async (userId: string): Promise<Message[]> => {
  const db = await getDB();
  const tx = db.transaction('messages', 'readonly');
  const store = tx.objectStore('messages');
  const index = store.index('timestamp-userId');
  const messages = await index.getAll(IDBKeyRange.bound(['', userId], ['￿', userId]));
  return messages.map((msg) => ({
    ...msg,
    userId: undefined, // Remove userId from the returned message
  }));
};

const AdminChatWindow = ({ userId, username, socket, isMobile, onBack }: AdminChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPaymentRequests, setShowPaymentRequests] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    accountNumber: '',
    ifscCode: '',
    amount: '',
    name: '',
    upiId: '',
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const adminId = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      console.log('scrollToBottom called, scrollHeight:', chatContainerRef.current.scrollHeight);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      console.warn('chatContainerRef.current is null');
    }
  }, []);

  const markMessagesAsRead = useCallback(() => {
    if (userId && socket) {
      adminService
        .markMessagesAsRead(userId)
        .then(() => {
          socket.emit('markMessagesAsRead', { chatId: userId });
          socket.emit('syncUnreadCounts');
        })
        .catch((error) => console.error('Failed to mark messages as read:', error));
    }
  }, [userId, socket]);

  const fetchPaymentRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response: any = await axios.get(`${import.meta.env.VITE_API_URL}/admin/payment-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentRequests(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
    }
  }, []);

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
        if (!navigator.onLine) {
          // Load from IndexedDB if offline
          const cachedMessages = await getMessagesFromDB(userId);
          setMessages(cachedMessages);
          setTimeout(() => scrollToBottom(), 100);
          return;
        }

        const chat = await adminService.getUserChatHistory(userId);
        const formattedMessages: Message[] = chat.messages
          .map((msg: any) => {
            if (!msg || !msg._id || !msg.sender_id) return null;
            return {
              _id: msg._id.toString(),
              content: msg.content || '',
              isSelf: msg.sender_id.toString() === adminId.current,
              messageType: msg.message_type || 'text',
              status: 'delivered' as const,
              senderId: msg.sender_id.toString(),
              chatId: chat._id.toString(),
              duration: msg.duration || 0,
              timestamp: msg.timestamp || new Date().toISOString(),
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
            };
          })
          .filter((msg: any): msg is Message => msg !== null)
          .filter((msg:any) => !msg.isDeleted) // Filter out deleted messages initially
          .sort((a: any, b: any) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());

        setMessages(formattedMessages);
        saveMessages(userId, formattedMessages); // Save to IndexedDB
        setTimeout(() => scrollToBottom(), 100);
        markMessagesAsRead();
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([]);
      }
    };

    fetchChatHistory();
    fetchPaymentRequests();

    const handleNewMessage = (message: Message) => {
      if (message.chatId === userId || message.senderId === userId) {
        const isAdminMessage = message.senderId === adminId.current;
        setMessages((prev) => {
          const newMessages = [...prev, { ...message, status: 'delivered' as const, isSelf: isAdminMessage }];
          saveMessages(userId, newMessages); // Update IndexedDB
          return newMessages;
        });
        setTimeout(() => scrollToBottom(), 100);
        if (!isAdminMessage) markMessagesAsRead();
      }
    };

    const handleScreenshotUploaded = ({ paymentRequestId, userId: uploadedUserId, screenshotUrl }: { paymentRequestId: string; userId: string; screenshotUrl: string }) => {
      if (uploadedUserId === userId) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setPaymentRequests((prev) =>
          prev.map((pr) =>
            pr._id === paymentRequestId ? { ...pr, status: 'uploaded', screenshotUrl } : pr
          )
        );
        fetchChatHistory();
      }
    };

    const handleMessageEdited = (updatedMessage: { _id: string; content: string; isEdited: boolean }) => {
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        );
        saveMessages(userId, updatedMessages); // Update IndexedDB
        return updatedMessages;
      });
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      console.log('Admin received messageDeleted for messageId:', messageId);
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg));
        saveMessages(userId, updatedMessages); // Update IndexedDB
        return updatedMessages;
      });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('screenshotUploaded', handleScreenshotUploaded);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('screenshotUploaded', handleScreenshotUploaded);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [userId, socket, markMessagesAsRead, fetchPaymentRequests]);

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100);
  }, [messages, scrollToBottom]);

  const handleRequestScreenshot = async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/payment-request`,
        {
          userId,
          paymentDetails: {
            accountNumber: paymentDetails.accountNumber,
            ifscCode: paymentDetails.ifscCode.toUpperCase(),
            amount: paymentDetails.amount,
            name: paymentDetails.name,
            upiId: paymentDetails.upiId,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowToast(true);
      setShowRequestModal(false);
      setTimeout(() => setShowToast(false), 3000);
      setPaymentDetails({ accountNumber: '', ifscCode: '', amount: '', name: '', upiId: '' });
      fetchPaymentRequests();
    } catch (error) {
      console.error('Failed to request screenshot:', error);
    }
  };

  const handleSend = useCallback(
    async (messageType: 'text' | 'image' | 'voice', content: string | File, duration?: number) => {
      if (!userId || !adminId.current || !socket) return;

      const tempId = Date.now().toString();
      const tempTimestamp = new Date().toISOString();
      const tempMessage: Message = {
        _id: tempId,
        content: messageType === 'text' ? (content as string) : 'Uploading...',
        isSelf: true,
        messageType,
        status: 'sending',
        senderId: adminId.current,
        chatId: userId,
        duration: messageType === 'voice' ? duration : undefined,
        timestamp: tempTimestamp,
      };
      setMessages((prev) => {
        const newMessages = [...prev, tempMessage];
        saveMessages(userId, newMessages); // Save to IndexedDB
        return newMessages;
      });
      setTimeout(() => scrollToBottom(), 100);

      try {
        let messageContent: string | ArrayBuffer;
        if (messageType === 'text') {
          messageContent = content as string;
        } else {
          messageContent = await (content as File).arrayBuffer();
        }

        const messageData = {
          targetUserId: userId,
          messageType,
          content: messageContent,
          duration: messageType === 'voice' ? duration : undefined,
          tempId,
        };
        console.log('Sending message via socket:', {
          ...messageData,
          content: messageType === 'text' ? messageContent : '[ArrayBuffer]',
        });

        socket.emit('sendMessage', messageData, (response: { status: string; message?: any }) => {
          if (response.status === 'success') {
            const savedMessage = response.message;
            console.log('Message sent successfully:', savedMessage);
            setMessages((prev) => {
              const updatedMessages = prev.map((msg) =>
                msg._id === tempId
                  ? {
                      ...msg,
                      _id: savedMessage._id,
                      content: savedMessage.content,
                      status: 'delivered' as const,
                      timestamp: savedMessage.timestamp,
                    }
                  : msg
              );
              saveMessages(userId, updatedMessages); // Update IndexedDB
              return updatedMessages;
            });
            socket.emit('updateUserOrder', {
              userId: userId,
              timestamp: savedMessage.timestamp,
            });
            setTimeout(() => scrollToBottom(), 100);
          } else {
            console.error('Failed to send message via socket:', response);
            setMessages((prev:any) => {
              const updatedMessages = prev.map((msg:any) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg));
              saveMessages(userId, updatedMessages); // Update IndexedDB
              return updatedMessages;
            });
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev:any) => {
          const updatedMessages = prev.map((msg:any) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg));
          saveMessages(userId, updatedMessages); // Update IndexedDB
          return updatedMessages;
        });
      }
    },
    [userId, socket]
  );

  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleEditSave = (messageId: string) => {
    chatService
      .editMessageAdmin(messageId, editedContent)
      .then(() => {
        socket.emit('editMessage', { messageId, content: editedContent });
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg._id === messageId ? { ...msg, content: editedContent, isEdited: true } : msg
          );
          if (userId) saveMessages(userId, updatedMessages); // Update IndexedDB
          return updatedMessages;
        });
        setEditingMessageId(null);
        setEditedContent('');
      })
      .catch((error) => console.error('Failed to edit message:', error));
  };

  const handleDelete = (messageId: string) => {
    console.log('handleDelete called in AdminChatWindow for messageId:', messageId);
    socket.emit('deleteMessage', { messageId }, (response: { status: string }) => {
      if (response.status === 'success') {
        console.log('Message deleted successfully via socket, removing from state:', messageId);
        setMessages((prev) => {
          const updatedMessages = prev.filter((msg) => msg._id !== messageId); // Remove the message entirely
          if (userId) saveMessages(userId, updatedMessages);
          return updatedMessages;
        });
      } else {
        console.error('Socket deletion failed:', response);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const isPaymentDetailsValid = () => {
    return  true
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm">
      {userId ? (
        <>
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-black/95 via-black/90 to-black/95 border-b border-amber-500/10 backdrop-blur-xl">
  <div className="flex items-center justify-between px-4 py-4">
    <div className="flex items-center space-x-3 min-w-0">
      {isMobile && onBack && (
        <button
          onClick={onBack}
          className="md:hidden p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/30 flex-shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      <div className="relative group flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-lg flex items-center justify-center border border-amber-500/20 transition-all duration-300 group-hover:border-amber-500/30">
          <span className="text-lg font-medium text-amber-400 group-hover:text-amber-300">
            {username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="absolute -inset-0.5 bg-amber-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-medium text-amber-50/90 truncate">{username || 'User'}</h3>
        <p className="text-sm text-amber-400/60 truncate">Active Now</p>
      </div>
    </div>
    <div className="flex items-center space-x-2 flex-shrink-0">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowUserDetails(true)}
        className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/30"
        title="View User Details"
      >
        <User className="w-5 h-5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowPaymentRequests(true)}
        className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-400 hover:text-amber-300 border border-amber-500/20 transition-all duration-300 hover:border-amber-500/30"
        title="View Payment Requests"
      >
        <Image className="w-5 h-5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowRequestModal(true)}
        className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 px-4 py-2 rounded-lg hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300"
        title="Request Payment Screenshot"
      >
        <DollarSign className="w-5 h-5" />
      </motion.button>
    </div>
  </div>
</div>
          {/* Chat Container */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-3 sm:px-4 pb-2 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent"
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

            {/* Input */}
            <div className="sticky bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/90 to-black/85 backdrop-blur-xl border-t border-amber-500/10">
              <div className="px-2 py-1 sm:px-3 sm:py-1">
                <ChatInput onSend={handleSend} />
              </div>
            </div>
          </div>

          {/* Modals */}
          <div className="z-30">
            {/* Payment Request Modal */}
            <AnimatePresence>
              {showRequestModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-2"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-b from-gray-900 to-black p-4 rounded-2xl shadow-xl border border-white/10 w-full max-w-md"
                  >
                    <h4 className="text-lg font-semibold text-white mb-3">Request Payment Screenshot</h4>
                    <p className="text-white/80 text-sm mb-4">
                      Enter payment details for {username || 'this user'}.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="accountNumber"
                        value={paymentDetails.accountNumber}
                        onChange={handleInputChange}
                        placeholder="Account Number"
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        name="ifscCode"
                        value={paymentDetails.ifscCode}
                        onChange={handleInputChange}
                        placeholder="IFSC Code"
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        name="amount"
                        value={paymentDetails.amount}
                        onChange={handleInputChange}
                        placeholder="Amount (e.g., 500)"
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        name="name"
                        value={paymentDetails.name}
                        onChange={handleInputChange}
                        placeholder="Account Holder Name"
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        name="upiId"
                        value={paymentDetails.upiId}
                        onChange={handleInputChange}
                        placeholder="UPI ID (e.g., name@upi)"
                        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowRequestModal(false)}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1.5 rounded-lg hover:from-gray-700 hover:to-gray-800 flex items-center space-x-1 text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRequestScreenshot}
                        disabled={!isPaymentDetailsValid()}
                        className={`bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 text-sm ${
                          !isPaymentDetailsValid() ? 'opacity-60 cursor-not-allowed' : 'hover:from-green-700 hover:to-green-800'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Send</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Requests View Modal */}
            <AnimatePresence>
              {showPaymentRequests && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-2"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-b from-gray-900 to-black p-4 rounded-2xl shadow-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-white">Payment Requests for {username}</h4>
                      <button
                        onClick={() => setShowPaymentRequests(false)}
                        className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {paymentRequests
                        .filter((pr) => pr.userId._id === userId)
                        .map((pr) => (
                          <motion.div
                            key={pr._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-gray-800 rounded-lg border border-white/10"
                          >
                            <div className="space-y-1 text-sm text-gray-200">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">Account:</span>
                                <span>{pr.paymentDetails.accountNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">IFSC:</span>
                                <span>{pr.paymentDetails.ifscCode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">Amount:</span>
                                <span className="text-amber-400 font-semibold">₹{pr.paymentDetails.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">Name:</span>
                                <span>{pr.paymentDetails.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">UPI:</span>
                                <span>{pr.paymentDetails.upiId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-400">Status:</span>
                                <span className={pr.status === 'uploaded' ? 'text-green-400' : 'text-yellow-400'}>
                                  {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                                </span>
                              </div>
                              {pr.screenshotUrl && (
                                <div className="mt-2">
                                  <a
                                    href={pr.screenshotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-400 hover:underline flex items-center space-x-1 text-sm"
                                  >
                                    <Image className="w-4 h-4" />
                                    <span>View Screenshot</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      {paymentRequests.filter((pr) => pr.userId._id === userId).length === 0 && (
                        <p className="text-white/70 text-center text-sm">No payment requests found.</p>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User Details Modal */}
            {showUserDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-2"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gradient-to-b from-gray-900 to-black p-4 rounded-2xl shadow-xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white">User Details</h4>
                    <button
                      onClick={() => setShowUserDetails(false)}
                      className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <AdminUserDetails userId={userId} />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 left-2 right-2 md:bottom-6 md:right-4 md:left-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg shadow-md text-sm flex items-center justify-center space-x-2 z-30"
              >
                <DollarSign className="w-4 h-4" />
                <span>Screenshot request sent/received</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/70 text-base">
            {isMobile ? 'Select a user to chat' : 'No user selected'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;