import { useState, useEffect, useRef, useCallback } from 'react';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Check, User, ArrowLeft } from 'lucide-react';
import AdminUserDetails from './AdminUserDetails';

interface Message {
  _id: string;
  content: string;
  isSelf: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'screenshot';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  senderId?: string;
  chatId?: string;
  timestamp?: string;
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

interface AdminChatWindowProps {
  userId: string | null;
  username?: string | null;
  socket: any;
  isMobile: boolean;
  onBack?: () => void;
}

const AdminChatWindow = ({ userId, username, socket, isMobile, onBack }: AdminChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [screenshotStatus, setScreenshotStatus] = useState<'none' | 'requested' | 'fulfilled'>('none');
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
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
        const formattedMessages: Message[] = chat.messages
          .map((msg: any) => {
            if (!msg || !msg._id || !msg.sender_id) {
              console.warn('Invalid message format:', msg);
              return null;
            }
            return {
              _id: msg._id.toString(),
              content: msg.content || '',
              isSelf: msg.sender_id.toString() === adminId.current,
              messageType: msg.message_type || 'text',
              status: 'delivered' as const,
              senderId: msg.sender_id.toString(),
              chatId: chat._id.toString(),
              timestamp: msg.timestamp || new Date().toISOString(),
              isEdited: msg.isEdited || false,
              isDeleted: msg.isDeleted || false,
            };
          })
          .filter((msg: any): msg is Message => msg !== null)
          .sort((a: any, b: any) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());

        setMessages(formattedMessages);
        const hasRecentScreenshot = formattedMessages.some(
          (msg) =>
            msg.messageType === 'screenshot' &&
            !msg.isSelf &&
            new Date(msg.timestamp || '').getTime() > Date.now() - 24 * 60 * 60 * 1000
        );
        setScreenshotStatus(hasRecentScreenshot ? 'fulfilled' : 'none');
        setTimeout(() => scrollToBottom(), 0);
        markMessagesAsRead();
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        setMessages([]);
      }
    };

    fetchChatHistory();

    const handleNewMessage = (message: Message) => {
      if (message.chatId === userId || message.senderId === userId) {
        const isAdminMessage = message.senderId === adminId.current;
        setMessages((prev) => [
          ...prev,
          { ...message, status: 'delivered' as const, isSelf: isAdminMessage },
        ]);
        if (message.messageType === 'screenshot' && !isAdminMessage) {
          setScreenshotStatus('fulfilled');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
        setTimeout(() => scrollToBottom(), 0);
        if (!isAdminMessage) markMessagesAsRead();
      }
    };

    const handleScreenshotFulfilled = ({ userId: fulfilledUserId }: { userId: string }) => {
      if (fulfilledUserId === userId) {
        setScreenshotStatus('fulfilled');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    };

    const handleMessageEdited = (updatedMessage: { _id: string; content: string; isEdited: boolean }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        )
      );
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('screenshotFulfilled', handleScreenshotFulfilled);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('screenshotFulfilled', handleScreenshotFulfilled);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [userId, socket, scrollToBottom, markMessagesAsRead]);

  const handleRequestScreenshot = () => {
    if (!userId || !socket) return;
    const paymentRequest = {
      userId,
      paymentDetails: {
        accountNumber: paymentDetails.accountNumber,
        ifscCode: paymentDetails.ifscCode.toUpperCase(),
        amount: paymentDetails.amount,
        name: paymentDetails.name,
        upiId: paymentDetails.upiId,
      },
    };
    socket.emit('requestScreenshot', paymentRequest);
    setScreenshotStatus('requested');
    setShowToast(true);
    setShowRequestModal(false);
    setTimeout(() => setShowToast(false), 3000);
    setPaymentDetails({ accountNumber: '', ifscCode: '', amount: '', name: '', upiId: '' });
  };

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
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      try {
        const response = await adminService.sendMessageToUser(userId, messageType, content);
        const savedMessage = response.messages[response.messages.length - 1];
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId
              ? {
                  ...msg,
                  _id: savedMessage._id.toString(),
                  content: savedMessage.content,
                  status: 'delivered' as const,
                  timestamp: savedMessage.timestamp,
                }
              : msg
          )
        );
        scrollToBottom();
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
        );
      }
    },
    [userId, scrollToBottom]
  );

  const handleEditStart = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleEditSave = (messageId: string) => {
    adminService
      .editMessage(messageId, editedContent)
      .then(() => {
        socket.emit('editMessage', { messageId, content: editedContent });
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
    adminService
      .deleteMessage(messageId)
      .then(() => {
        socket.emit('deleteMessage', { messageId });
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
        );
      })
      .catch((error) => console.error('Failed to delete message:', error));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const isPaymentDetailsValid = () => {
    return (
      paymentDetails.accountNumber.trim() &&
      paymentDetails.ifscCode.trim() &&
      paymentDetails.amount.trim() &&
      paymentDetails.name.trim() &&
      paymentDetails.upiId.trim()
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-sm">
      {userId ? (
        <>
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                {isMobile && onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 rounded-lg bg-amber-500/20 text-white hover:bg-amber-500/30 border border-amber-500/30"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                  <span className="text-sm font-medium text-amber-500">
                    {username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-medium text-white truncate">{username || 'User'}</h3>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowUserDetails(true)}
                  className="p-2 rounded-xl bg-amber-500/20 text-white hover:bg-amber-500/30 border border-amber-500/30 transition-all duration-300"
                  title="View User Details"
                >
                  <User className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowRequestModal(true)}
                  className={`bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1.5 rounded-xl shadow-md hover:from-amber-700 hover:to-amber-800 transition-all duration-300 text-sm font-semibold border border-amber-500/30 ${
                    screenshotStatus === 'fulfilled' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  disabled={screenshotStatus === 'fulfilled' || !userId || !socket}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">
                    {screenshotStatus === 'fulfilled' ? 'Received' : 'Request'}
                  </span>
                  <span className="sm:hidden">Request</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
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

          {/* Chat Input */}
          <div className="p-2 border-t border-white/10 bg-black/20 backdrop-blur-sm flex-shrink-0">
            <ChatInput onSend={handleSend} />
          </div>

          {/* Payment Request Modal */}
          <AnimatePresence>
            {showRequestModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gradient-to-b from-gray-900 to-black p-4 rounded-2xl shadow-xl border border-white/10 w-full max-w-sm max-h-[80vh] overflow-y-auto"
                >
                  <h4 className="text-lg font-semibold text-white mb-3">Request Payment</h4>
                  <p className="text-white/80 text-sm mb-4">
                    Enter details for {username || 'this user'}.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="accountNumber"
                      value={paymentDetails.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Account Number"
                      className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500 text-sm"
                    />
                    <input
                      type="text"
                      name="ifscCode"
                      value={paymentDetails.ifscCode}
                      onChange={handleInputChange}
                      placeholder="IFSC Code"
                      className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500 text-sm"
                    />
                    <input
                      type="text"
                      name="amount"
                      value={paymentDetails.amount}
                      onChange={handleInputChange}
                      placeholder="Amount"
                      className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500 text-sm"
                    />
                    <input
                      type="text"
                      name="name"
                      value={paymentDetails.name}
                      onChange={handleInputChange}
                      placeholder="Account Holder Name"
                      className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500 text-sm"
                    />
                    <input
                      type="text"
                      name="upiId"
                      value={paymentDetails.upiId}
                      onChange={handleInputChange}
                      placeholder="UPI ID"
                      className="w-full p-2 rounded-lg bg-gray-800 text-white border border-amber-500/30 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowRequestModal(false)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1.5 rounded-lg shadow-md hover:from-gray-700 hover:to-gray-800 text-sm"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRequestScreenshot}
                      disabled={!isPaymentDetailsValid()}
                      className={`bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-lg shadow-md text-sm ${
                        !isPaymentDetailsValid() ? 'opacity-60 cursor-not-allowed' : 'hover:from-green-700 hover:to-green-800'
                      }`}
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Send
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast Notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-xl shadow-md text-sm font-medium flex items-center space-x-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>{screenshotStatus === 'fulfilled' ? 'Screenshot received' : 'Request sent'}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Details Modal */}
          {showUserDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/70 text-base">{isMobile ? 'Select a user' : 'No user selected'}</p>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;