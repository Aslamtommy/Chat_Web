import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAdminChat } from '../hooks/useAdminChat';
import AdminChatWindow from '../components/chat/AdminChatWindow';
import MessageInput from '../components/chat/MessageInput';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserCircle, LogOut, X } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth(); // Add authLoading
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { threads, messages, sendMessage, threadsLoading, messagesLoading } = useAdminChat(selectedUserId); // Add loading states from hook
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedUser = threads && selectedUserId
    ? threads.find((t: any) => {
        const tUserId = t.user_id instanceof Object ? t.user_id._id?.toString() : t.user_id;
        return tUserId === selectedUserId;
      })?.user_id
    : null;

  // Show loading spinner while authentication is being resolved
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3"
        >
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
          </svg>
          <span className="text-lg text-gray-700 font-medium">Loading...</span>
        </motion.div>
      </div>
    );
  }

  // Restrict access to admins only
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-gray-600 text-lg font-medium"
        >
          Restricted to Administrators
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium text-gray-900">
            Admin Dashboard
            <span className="text-gray-500 text-sm ml-2">({user.email})</span>
          </h1>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors border border-gray-700 shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={16} />
            <span className="font-medium">Sign Out</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <motion.aside
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="w-72 bg-white border-r border-gray-200 fixed top-16 left-0 bottom-0 p-6 overflow-y-auto"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Chat Threads</h2>
          {threadsLoading ? (
            <div className="flex items-center justify-center h-32">
              <svg
                className="animate-spin h-6 w-6 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
            </div>
          ) : !threads || threads.length === 0 ? (
            <p className="text-gray-500 text-sm">No active threads</p>
          ) : (
            threads.map((thread: any) => {
              const threadId = thread._id?.toString() || `thread-${Math.random()}`;
              const userId = thread.user_id instanceof Object ? thread.user_id._id?.toString() : thread.user_id;
              const username = thread.user_id instanceof Object ? thread.user_id.username || 'Unknown' : userId || 'Unknown';

              if (!userId) return null;

              return (
                <motion.div
                  key={threadId}
                  onClick={() => setSelectedUserId(userId)}
                  className={`p-3 rounded-md mb-2 cursor-pointer text-sm ${
                    selectedUserId === userId ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                  whileHover={{ scale: 1.02 }}
                >
                  {username}
                </motion.div>
              );
            })
          )}
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 ml-72 p-6">
          {selectedUserId ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Chat with {selectedUser instanceof Object ? selectedUser.username : selectedUserId}
                </h2>
                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <UserCircle size={24} />
                </motion.button>
              </div>
              <div className="h-[calc(100vh-12rem)] flex flex-col">
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <svg
                      className="animate-spin h-8 w-8 text-indigo-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                    </svg>
                  </div>
                ) : (
                  <AdminChatWindow messages={messages} adminId={user._id.toString()} />
                )}
                <MessageInput sendMessage={sendMessage} />
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
              Select a thread to begin
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Details</h3>
            <div className="space-y-3 text-gray-700">
              {[
                { label: 'Username', value: selectedUser.username },
                { label: 'Email', value: selectedUser.email },
                { label: 'Age', value: selectedUser.age },
                { label: "Father's Name", value: selectedUser.fathersName },
                { label: "Mother's Name", value: selectedUser.mothersName },
                { label: 'Phone', value: selectedUser.phoneNo },
                { label: 'Place', value: selectedUser.place },
                { label: 'District', value: selectedUser.district },
              ].map(({ label, value }) => (
                <p key={label}>
                  <span className="font-medium">{label}:</span>{' '}
                  <span className="text-gray-600">{value || 'N/A'}</span>
                </p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;