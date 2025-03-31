import { useState, useEffect, useRef, useCallback } from 'react';
import adminService from '../Services/adminService';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Check, User } from 'lucide-react'; // Added User icon
import AdminUserDetails from './AdminUserDetails';

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
  const [showToast, setShowToast] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const adminId = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const markMessagesAsRead = useCallback(() => {
    if (userId && socket) {
      adminService.markMessagesAsRead(userId)
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
        markMessagesAsRead();
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
        if (!message.isSelf) {
          markMessagesAsRead();
        }
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [userId, socket, scrollToBottom, markMessagesAsRead]);

  const handleRequestScreenshot = () => {
    if (!userId || !socket) return;
    socket.emit('requestScreenshot', { userId });
    setShowToast(true);
    setShowRequestModal(false);
    setTimeout(() => setShowToast(false), 3000);
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
    <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-sm relative">
      {userId ? (
        <>
          <div className="p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-b border-white/10 relative">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <span className="text-sm font-medium text-amber-500">
                  {username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-medium text-white">{username || 'User'}</h3>
            </div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {/* User Details Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUserDetails(true)}
                className="p-2 rounded-xl bg-amber-500/20 text-white hover:bg-amber-500/30 
                  border border-amber-500/30 transition-all duration-300 flex items-center space-x-2"
                title="View User Details"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">User Details</span>
              </motion.button>

              {/* Request Payment Screenshot Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowRequestModal(true)}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 rounded-xl 
                  shadow-md hover:from-amber-700 hover:to-amber-800 transition-all duration-300 
                  flex items-center space-x-2 text-sm font-semibold 
                  disabled:opacity-60 disabled:cursor-not-allowed border border-amber-500/30"
                disabled={!userId || !socket}
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Request Payment Screenshot</span>
              </motion.button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
            <ChatList messages={messages} />
          </div>
          <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm relative">
            <ChatInput onSend={handleSend} />
          </div>

          {/* Confirmation Modal */}
          <AnimatePresence>
            {showRequestModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-2xl shadow-xl border border-white/10 
                    w-11/12 max-w-md mx-4"
                >
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Request Payment Screenshot
                  </h4>
                  <p className="text-white/80 text-sm mb-6">
                    Are you sure you want to request a payment screenshot from {username || 'this user'}?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowRequestModal(false)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg 
                        shadow-md hover:from-gray-700 hover:to-gray-800 transition-all duration-300 
                        flex items-center space-x-2 text-sm font-medium"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRequestScreenshot}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg 
                        shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-300 
                        flex items-center space-x-2 text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      <span>Send</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Toast */}
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 
                bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl 
                shadow-md text-sm font-medium flex items-center space-x-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Payment screenshot request sent</span>
            </motion.div>
          )}

          {/* User Details Modal */}
          {showUserDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-2xl shadow-xl border border-white/10 
                  w-11/12 max-w-2xl mx-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-semibold text-white">User Details</h4>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
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
          <p className="text-white/70 text-lg">
            {isMobile ? 'Select a user to start chatting' : 'No user selected'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminChatWindow;