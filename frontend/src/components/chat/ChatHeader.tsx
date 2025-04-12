import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText, User, Bell, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ChatHeaderProps {
  onProfileClick: () => void;
}

interface Link {
  _id: string;
  title: string;
  url: string;
}

const ChatHeader: FC<ChatHeaderProps> = ({ onProfileClick }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `${import.meta.env.VITE_API_URL}`;

  const fetchLinks = async () => {
    try {
      const response: any = await axios.get(`${API_URL}/auth/links`);
      setLinks(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Unable to load links. Please try again later.');
      console.error('Fetch links error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    if (isLinksModalOpen) {
      fetchLinks();
    }
  }, [isLinksModalOpen]);

  const buttonVariants = {
    initial: { scale: 1, translateZ: 0, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)' },
    hover: {
      scale: 1.1,
      translateZ: 10,
      boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)',
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    tap: {
      scale: 0.95,
      translateZ: 5,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.2 },
    },
  };

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <header className="px-4 py-3 sm:px-6 sm:py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <MessageSquareText className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            <div className="absolute -inset-1 bg-amber-500/20 rounded-lg blur-sm -z-10" />
          </div>
          <h2 className="text-lg sm:text-2xl font-serif text-white tracking-wide">
            Arabic Jyothisham
            <span className="block text-xs sm:text-sm text-white/60 font-sans tracking-normal mt-0.5">
              Chat Consultation
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsLinksModalOpen(true)}
            className="flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-2 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Link2 className="w-5 h-5 group-hover:stroke-amber-500" />
            <span className="text-sm font-medium hidden sm:inline">Useful Links</span>
          </motion.button>

          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate('/notifications')}
            className="relative flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-2 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Bell className="w-5 h-5 group-hover:stroke-amber-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
            <span className="text-sm font-medium hidden sm:inline">Notifications</span>
          </motion.button>

          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={onProfileClick}
            className="flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-2 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <User className="w-5 h-5 group-hover:stroke-amber-500" />
            <span className="text-sm font-medium hidden sm:inline">Profile</span>
          </motion.button>

          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-2 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <LogOut className="w-5 h-5 group-hover:stroke-amber-500" />
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isLinksModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLinksModalOpen(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-950 to-black bg-opacity-95 p-6 rounded-xl shadow-xl border border-amber-500/30 w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-6 h-6 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
                  Useful Links
                </h2>
              </div>
              {error ? (
                <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg mb-4">
                  {error}
                </p>
              ) : links.length === 0 ? (
                <p className="text-white/60 text-sm font-medium bg-white/5 p-3 rounded-lg mb-4">
                  No links available yet.
                </p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] pr-2 custom-scrollbar">
                  {links.map((link) => (
                    <a
                      key={link._id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 group"
                    >
                      <p className="font-medium text-white group-hover:text-amber-300 text-sm">
                        {link.title}
                      </p>
                      <p className="text-xs text-white/50 group-hover:text-amber-200 truncate mt-1">
                        {link.url}
                      </p>
                    </a>
                  ))}
                </div>
              )}
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-[0_2px_8px_rgba(251,191,36,0.2)] hover:shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ChatHeader;