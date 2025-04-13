import { useState, useEffect, useRef, useCallback } from 'react';
import adminService, { saveMessages, getMessagesFromDB } from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X,  User, ArrowLeft, Image, ZoomIn, ZoomOut } from 'lucide-react';
import AdminUserDetails from './AdminUserDetails';
import chatService from '../Services/chatService';
import axios from 'axios';

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
  username: string | null;
  socket: any;
  isMobile: boolean;
  onBack: () => void;
  onModalOpen: () => void;
  onModalClose: () => void;
}

const AdminChatWindow = ({ 
  userId, 
  username, 
  socket, 
  isMobile, 
  onBack,
  onModalOpen,
  onModalClose 
}: AdminChatWindowProps) => {
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
  const isMounted = useRef(false);
  const [showImageModal ] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current && isMounted.current) {
      console.log('[AdminChatWindow] scrollToBottom called, scrollHeight:', chatContainerRef.current.scrollHeight);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else {
      console.warn('[AdminChatWindow] chatContainerRef.current is null or not mounted');
    }
  }, []);

  const markMessagesAsRead = useCallback(() => {
    if (userId && socket) {
      console.log('[AdminChatWindow] Marking messages as read for:', userId);
      adminService
        .markMessagesAsRead(userId)
        .then(() => {
          socket.emit('markMessagesAsRead', { chatId: userId });
          socket.emit('syncUnreadCounts');
        })
        .catch((error) => console.error('[AdminChatWindow] Failed to mark messages as read:', error));
    }
  }, [userId, socket]);

  const fetchPaymentRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('[AdminChatWindow] Fetching payment requests, token:', !!token);
      const response: any = await axios.get(`${import.meta.env.VITE_API_URL}/admin/payment-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[AdminChatWindow] Received payment requests:', response.data.data);
      setPaymentRequests(response.data.data);
    } catch (error) {
      console.error('[AdminChatWindow] Failed to fetch payment requests:', error);
    }
  }, []);

  useEffect(() => {
    console.log('[AdminChatWindow] Mounting component, userId:', userId);
    isMounted.current = true;
    const token = localStorage.getItem('adminToken');
    if (!token || !userId) {
      console.log('[AdminChatWindow] No token or userId, resetting messages');
      setMessages([]);
      return;
    }

    const decoded = JSON.parse(atob(token.split('.')[1]));
    adminId.current = decoded.id;
    console.log('[AdminChatWindow] Decoded adminId:', adminId.current);

    const fetchChatHistory = async () => {
      try {
        if (!navigator.onLine) {
          console.log('[AdminChatWindow] Offline, loading from IndexedDB for:', userId);
          const cachedMessages = await getMessagesFromDB(userId);
          console.log('[AdminChatWindow] Cached messages:', cachedMessages);
          setMessages(cachedMessages);
          setTimeout(() => scrollToBottom(), 100);
          return;
        }

        console.log('[AdminChatWindow] Fetching chat history for:', userId);
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
          .filter((msg: any) => !msg.isDeleted)
          .sort((a: any, b: any) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());

        console.log('[AdminChatWindow] Formatted messages:', formattedMessages);
        setMessages(formattedMessages);
        saveMessages(userId, formattedMessages);
        setTimeout(() => scrollToBottom(), 100);
        markMessagesAsRead();
      } catch (error) {
        console.error('[AdminChatWindow] Failed to fetch chat history:', error);
        setMessages([]);
      }
    };

    fetchChatHistory();
    fetchPaymentRequests();

    const handleNewMessage = (message: Message) => {
      console.log('[AdminChatWindow] Received new message:', message);
      if (message.chatId === userId || message.senderId === userId) {
        const isAdminMessage = message.senderId === adminId.current;
        setMessages((prev) => {
          const newMessages = [...prev, { ...message, status: 'delivered' as const, isSelf: isAdminMessage }];
          console.log('[AdminChatWindow] Updated messages with new message:', newMessages);
          saveMessages(userId, newMessages);
          return newMessages;
        });
        setTimeout(() => scrollToBottom(), 100);
        if (!isAdminMessage) markMessagesAsRead();
      }
    };

    const handleScreenshotUploaded = ({ paymentRequestId, userId: uploadedUserId, screenshotUrl }: { paymentRequestId: string; userId: string; screenshotUrl: string }) => {
      console.log('[AdminChatWindow] Screenshot uploaded event:', { paymentRequestId, uploadedUserId, screenshotUrl });
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
      console.log('[AdminChatWindow] Message edited event:', updatedMessage);
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        );
        console.log('[AdminChatWindow] Updated messages after edit:', updatedMessages);
        saveMessages(userId, updatedMessages);
        return updatedMessages;
      });
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      console.log('[AdminChatWindow] Message deleted event for:', messageId);
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg));
        console.log('[AdminChatWindow] Updated messages after delete:', updatedMessages);
        saveMessages(userId, updatedMessages);
        return updatedMessages;
      });
    };

    const handleUserDeleted = ({ userId: deletedUserId }: { userId: string }) => {
      console.log('[AdminChatWindow] User deleted event for:', deletedUserId);
      if (userId === deletedUserId) {
        setMessages([]);
        setPaymentRequests([]);
        if (onBack) onBack();
      }
    };

    socket?.on('newMessage', handleNewMessage);
    socket?.on('screenshotUploaded', handleScreenshotUploaded);
    socket?.on('messageEdited', handleMessageEdited);
    socket?.on('messageDeleted', handleMessageDeleted);
    socket?.on('userDeleted', handleUserDeleted);

    return () => {
      console.log('[AdminChatWindow] Unmounting component');
      isMounted.current = false;
      socket?.off('newMessage', handleNewMessage);
      socket?.off('screenshotUploaded', handleScreenshotUploaded);
      socket?.off('messageEdited', handleMessageEdited);
      socket?.off('messageDeleted', handleMessageDeleted);
      socket?.off('userDeleted', handleUserDeleted);
    };
  }, [userId, socket, markMessagesAsRead, fetchPaymentRequests, onBack]);

  useEffect(() => {
    console.log('[AdminChatWindow] Messages updated, triggering scroll:', messages.length);
    if (isMounted.current) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, scrollToBottom]);

  const handleRequestScreenshot = async () => {
    if (!userId) return;
    try {
      console.log('[AdminChatWindow] Requesting screenshot for:', userId, 'with details:', paymentDetails);
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
      console.error('[AdminChatWindow] Failed to request screenshot:', error);
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
      console.log('[AdminChatWindow] Sending temp message:', tempMessage);
      setMessages((prev) => {
        const newMessages = [...prev, tempMessage];
        console.log('[AdminChatWindow] Updated messages with temp:', newMessages);
        saveMessages(userId, newMessages);
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
        console.log('[AdminChatWindow] Emitting sendMessage with:', messageData);

        socket.emit('sendMessage', messageData, (response: { status: string; message?: any }) => {
          if (response.status === 'success') {
            const savedMessage = response.message;
            console.log('[AdminChatWindow] Message sent successfully:', savedMessage);
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
              console.log('[AdminChatWindow] Updated messages after success:', updatedMessages);
              saveMessages(userId, updatedMessages);
              return updatedMessages;
            });
            socket.emit('updateUserOrder', {
              userId: userId,
              timestamp: savedMessage.timestamp,
            });
            setTimeout(() => scrollToBottom(), 100);
          } else {
            console.error('[AdminChatWindow] Failed to send message via socket:', response);
            setMessages((prev: any) => {
              const updatedMessages = prev.map((msg: any) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg));
              console.log('[AdminChatWindow] Updated messages after failure:', updatedMessages);
              saveMessages(userId, updatedMessages);
              return updatedMessages;
            });
          }
        });
      } catch (error) {
        console.error('[AdminChatWindow] Error sending message:', error);
        setMessages((prev: any) => {
          const updatedMessages = prev.map((msg: any) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg));
          console.log('[AdminChatWindow] Updated messages after error:', updatedMessages);
          saveMessages(userId, updatedMessages);
          return updatedMessages;
        });
      }
    },
    [userId, socket]
  );

  const handleEditStart = (messageId: string, content: string) => {
    console.log('[AdminChatWindow] Starting edit for messageId:', messageId, 'content:', content);
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleEditSave = (messageId: string) => {
    console.log('[AdminChatWindow] Saving edit for messageId:', messageId, 'content:', editedContent);
    chatService
      .editMessageAdmin(messageId, editedContent)
      .then(() => {
        socket.emit('editMessage', { messageId, content: editedContent });
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg._id === messageId ? { ...msg, content: editedContent, isEdited: true } : msg
          );
          console.log('[AdminChatWindow] Updated messages after edit save:', updatedMessages);
          if (userId) saveMessages(userId, updatedMessages);
          return updatedMessages;
        });
        setEditingMessageId(null);
        setEditedContent('');
      })
      .catch((error) => console.error('[AdminChatWindow] Failed to edit message:', error));
  };

  const handleDelete = (messageId: string) => {
    console.log('[AdminChatWindow] Deleting message:', messageId);
    socket.emit('deleteMessage', { messageId }, (response: { status: string }) => {
      if (response.status === 'success') {
        console.log('[AdminChatWindow] Message deleted successfully, removing from state:', messageId);
        setMessages((prev) => {
          const updatedMessages = prev.filter((msg) => msg._id !== messageId);
          console.log('[AdminChatWindow] Updated messages after delete:', updatedMessages);
          if (userId) saveMessages(userId, updatedMessages);
          return updatedMessages;
        });
      } else {
        console.error('[AdminChatWindow] Socket deletion failed:', response);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('[AdminChatWindow] Payment input changed:', name, value);
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const isPaymentDetailsValid = () => {
    return true;
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onModalOpen();
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
    onModalClose();
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-black via-black/95 to-black/90">
      {userId ? (
        <>
          <div className="sticky top-0 z-20 bg-gradient-to-r from-black/95 via-black/90 to-black/95 border-b border-amber-500/10 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center space-x-3 min-w-0">
                {isMobile && onBack && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="md:hidden p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </motion.button>
                )}
                <div className="relative group flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 flex items-center justify-center border border-amber-500/20 transition-all duration-300 group-hover:border-amber-500/30 backdrop-blur-sm">
                    <span className="text-lg font-medium text-amber-500 group-hover:text-amber-400">
                      {username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -inset-0.5 bg-amber-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-amber-50/90 truncate">{username || 'User'}</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserDetails(true)}
                  className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors backdrop-blur-sm"
                  title="View User Details"
                >
                  <User className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPaymentRequests(true)}
                  className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors backdrop-blur-sm"
                  title="View Payment Requests"
                >
                  <Image className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRequestModal(true)}
                  className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-500 px-4 py-2 rounded-lg hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 backdrop-blur-sm"
                  title="Request Payment Screenshot"
                >
                  <DollarSign className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
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
            <div className="sticky bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/90 to-black/85 backdrop-blur-xl border-t border-amber-500/10">
              <div className="px-2 py-1 sm:px-3 sm:py-1">
                <ChatInput onSend={handleSend} isDisabled={false} />
              </div>
            </div>
          </div>
          <div className="z-30">
            <AnimatePresence>
              {showRequestModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    // Changed from w-full max-w-[480px] h-[90vh] sm:h-auto sm:max-h-[85vh] to w-full max-w-[400px] max-h-[70vh] to fit below header
                    className="bg-gradient-to-b from-black/90 to-black/80 p-4 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-[400px] max-h-[70vh] overflow-y-auto backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-amber-50/90">Request Payment Screenshot</h4>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowRequestModal(false)}
                        className="p-2 rounded-lg text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p className="text-amber-500/70 text-sm mb-4">
                      Enter payment details for {username || 'this user'}.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-amber-500/70 text-sm">Account Number</label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={paymentDetails.accountNumber}
                          onChange={handleInputChange}
                          placeholder="Enter account number"
                          className="w-full p-3 rounded-lg bg-black/50 text-amber-50 border border-amber-500/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-amber-500/70 text-sm">IFSC Code</label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={paymentDetails.ifscCode}
                          onChange={handleInputChange}
                          placeholder="Enter IFSC code"
                          className="w-full p-3 rounded-lg bg-black/50 text-amber-50 border border-amber-500/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-amber-500/70 text-sm">Amount</label>
                        <input
                          type="text"
                          name="amount"
                          value={paymentDetails.amount}
                          onChange={handleInputChange}
                          placeholder="Enter amount"
                          className="w-full p-3 rounded-lg bg-black/50 text-amber-50 border border-amber-500/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-amber-500/70 text-sm">Account Holder Name</label>
                        <input
                          type="text"
                          name="name"
                          value={paymentDetails.name}
                          onChange={handleInputChange}
                          placeholder="Enter account holder name"
                          className="w-full p-3 rounded-lg bg-black/50 text-amber-50 border border-amber-500/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-amber-500/70 text-sm">UPI ID</label>
                        <input
                          type="text"
                          name="upiId"
                          value={paymentDetails.upiId}
                          onChange={handleInputChange}
                          placeholder="Enter UPI ID"
                          className="w-full p-3 rounded-lg bg-black/50 text-amber-50 border border-amber-500/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRequestModal(false)}
                        className="px-4 py-2 rounded-lg bg-black/50 text-amber-500/70 hover:text-amber-500 border border-amber-500/20 hover:border-amber-500/30 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRequestScreenshot}
                        disabled={!isPaymentDetailsValid()}
                        className={`px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-500 border border-amber-500/20 hover:border-amber-500/30 transition-all ${
                          !isPaymentDetailsValid() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Send Request
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
  
            <AnimatePresence>
              {showPaymentRequests && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    // Changed from w-full max-w-[640px] h-[90vh] sm:h-auto sm:max-h-[85vh] to w-full max-w-[500px] max-h-[70vh] to fit below header
                    className="bg-gradient-to-b from-black/90 to-black/80 p-4 sm:p-6 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-[500px] max-h-[70vh] overflow-y-auto backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h4 className="text-lg sm:text-xl font-semibold text-amber-50/90">Payment Requests</h4>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPaymentRequests(false)}
                        className="p-2 rounded-lg text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {paymentRequests
                        .filter((pr) => pr.userId?._id === userId)
                        .map((pr) => (
                          <motion.div
                            key={pr._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-black/50 border border-amber-500/20"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">Account Number</span>
                                <span className="text-amber-50">{pr.paymentDetails.accountNumber}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">IFSC Code</span>
                                <span className="text-amber-50">{pr.paymentDetails.ifscCode}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">Amount</span>
                                <span className="text-amber-400 font-medium">₹{pr.paymentDetails.amount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">Name</span>
                                <span className="text-amber-50">{pr.paymentDetails.name}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">UPI ID</span>
                                <span className="text-amber-50">{pr.paymentDetails.upiId}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-500/70 text-sm">Status</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    pr.status === 'uploaded'
                                      ? 'bg-green-500/10 text-green-400'
                                      : 'bg-amber-500/10 text-amber-400'
                                  }`}
                                >
                                  {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                                </span>
                              </div>
                              {pr.screenshotUrl && (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if (pr.screenshotUrl) {
                                      handleImageClick(pr.screenshotUrl);
                                    }
                                  }}
                                  className="flex items-center space-x-2 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                                >
                                  <Image className="w-4 h-4" />
                                  <span className="text-sm">View Screenshot</span>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      {paymentRequests.filter((pr) => pr.userId?._id === userId).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-amber-500/50">
                          <Image className="w-12 h-12 mb-3" />
                          <p className="text-sm">No payment requests found</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
  
            <AnimatePresence>
              {showUserDetails && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    // Changed from w-full max-w-[640px] h-[90vh] sm:h-auto sm:max-h-[85vh] to w-full max-w-[500px] max-h-[70vh] to fit below header
                    className="bg-gradient-to-b from-black/90 to-black/80 p-4 sm:p-6 rounded-2xl shadow-2xl border border-amber-500/20 w-full max-w-[500px] max-h-[70vh] overflow-y-auto backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h4 className="text-lg sm:text-xl font-semibold text-amber-50/90">User Details</h4>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowUserDetails(false)}
                        className="p-2 rounded-lg text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <AdminUserDetails userId={userId} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
  
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-6 right-6 z-50"
                >
                  <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-500 px-4 py-3 rounded-lg shadow-lg border border-amber-500/20 backdrop-blur-sm flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm">Screenshot request sent/received</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-amber-500/50 text-base">
            {isMobile ? 'Select a user to chat' : 'No user selected'}
          </p>
        </div>
      )}
  
      {/* Image View Modal */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[60] p-4"
            onClick={handleCloseImageModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              // Changed from max-w-[90vw] max-h-[90vh] to max-w-[90vw] max-h-[70vh] to fit below header
              className="relative max-w-[90vw] max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg bg-black/50 text-amber-500 hover:text-amber-400 hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <ZoomIn className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-black/50 text-amber-500 hover:text-amber-400 hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <ZoomOut className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseImageModal}
                  className="p-2 rounded-lg bg-black/50 text-amber-500 hover:text-amber-400 hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <motion.img
                src={selectedImage}
                alt="Payment Screenshot"
                className="rounded-lg shadow-2xl border border-amber-500/20"
                style={{ transform: `scale(${imageScale})` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminChatWindow;