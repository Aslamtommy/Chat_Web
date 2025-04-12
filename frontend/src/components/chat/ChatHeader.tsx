import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText, User, Bell, Link2, Menu } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { useState, useEffect, useRef } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const buttonVariants = {
    initial: { 
      scale: 1, 
      translateZ: 0, 
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      background: 'rgba(0, 0, 0, 0.4)'
    },
    hover: {
      scale: 1.05,
      translateZ: 10,
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)',
      background: 'rgba(251, 191, 36, 0.05)',
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1],
        boxShadow: { duration: 0.2 }
      }
    },
    tap: {
      scale: 0.95,
      translateZ: 5,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)',
      transition: { duration: 0.2 }
    }
  };

  const notificationVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    pulse: {
      scale: [1, 1.1, 1],
      boxShadow: [
        '0 0 0 0 rgba(251, 191, 36, 0.4)',
        '0 0 0 6px rgba(251, 191, 36, 0)',
        '0 0 0 0 rgba(251, 191, 36, 0)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  const logoVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: { 
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        rotate: { duration: 0.4 }
      }
    },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    tap: {
      scale: 0.95,
      rotate: -2,
      transition: { duration: 0.2 }
    }
  };

  const glowVariants: Variants = {
    initial: { 
      opacity: 0,
      scale: 0.8
    },
    animate: { 
      opacity: [0.2, 0.4, 0.2],
      scale: [1, 1.1, 1],
      transition: { 
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    hover: {
      opacity: [0.4, 0.6, 0.4],
      scale: [1.1, 1.2, 1.1],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const innerGlowVariants: Variants = {
    initial: { 
      opacity: 0,
      scale: 0.8
    },
    animate: { 
      opacity: [0.1, 0.3, 0.1],
      scale: [1, 1.05, 1],
      transition: { 
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: 0.5
      }
    },
    hover: {
      opacity: [0.3, 0.5, 0.3],
      scale: [1.05, 1.1, 1.05],
      transition: {
        duration: 1,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: 0.5
      }
    }
  };

  const lightningVariants: Variants = {
    initial: { 
      opacity: 0,
      scale: 0.8,
      rotate: -10
    },
    animate: { 
      opacity: [0, 0.8, 0],
      scale: [1, 1.2, 1],
      rotate: [0, 5, 0],
      transition: { 
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: 0.2
      }
    },
    hover: {
      opacity: [0, 1, 0],
      scale: [1, 1.3, 1],
      rotate: [0, 8, 0],
      transition: {
        duration: 1,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: 0.2
      }
    }
  };

  return (
    <motion.header 
      className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-black via-black/95 to-black border-b border-white/5 backdrop-blur-xl"
      variants={headerVariants}
      initial="initial"
      animate="animate"
      layout
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-3 sm:gap-4"
          variants={itemVariants}
        >
          <motion.div 
            className="relative group"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg"
              variants={glowVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              style={{ filter: 'blur(8px)' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/5 rounded-lg"
              variants={innerGlowVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              style={{ filter: 'blur(4px)' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-amber-600/20 rounded-lg"
              variants={lightningVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              style={{ filter: 'blur(2px)' }}
            />
            <MessageSquareText 
              className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 group-hover:text-amber-400 transition-colors duration-300 relative z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" 
            />
          </motion.div>
          <motion.h2 
            className="text-lg sm:text-2xl font-serif text-white tracking-wide"
            variants={itemVariants}
          >
            Arabic Jyothisham
            <motion.span 
              className="block text-xs sm:text-sm text-white/50 font-sans tracking-normal mt-0.5"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Chat Consultation
            </motion.span>
          </motion.h2>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 sm:gap-4"
          variants={itemVariants}
        >
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate('/notifications')}
            className="relative flex items-center gap-2 text-white/80 hover:text-amber-400 font-sans px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-black/40 to-black/60 border border-white/10 hover:border-amber-500/40 group transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-amber-500/10"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Bell className="w-5 h-5 group-hover:stroke-amber-400 transition-colors duration-300" />
            <AnimatePresence>
            {unreadCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs shadow-lg shadow-amber-500/30"
                  variants={notificationVariants}
                  initial="initial"
                  animate={["animate", "pulse"]}
                  exit="exit"
                >
                {unreadCount}
                </motion.span>
            )}
            </AnimatePresence>
            <span className="text-sm font-medium hidden sm:inline">Notifications</span>
          </motion.button>

          <motion.div 
            className="relative" 
            ref={dropdownRef}
            variants={itemVariants}
          >
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-white/80 hover:text-amber-400 font-sans px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-black/40 to-black/60 border border-white/10 hover:border-amber-500/40 group transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-amber-500/10"
            style={{ transformStyle: 'preserve-3d' }}
          >
              <Menu className="w-6 h-6 sm:w-7 sm:h-7 group-hover:stroke-amber-400 transition-colors duration-300" />
              <span className="text-sm font-medium hidden sm:inline">Menu</span>
          </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ 
                    duration: 0.2, 
                    ease: [0.4, 0, 0.2, 1],
                    scale: { duration: 0.15 }
                  }}
                  className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-black via-black/95 to-black/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
                >
                  <motion.div 
                    className="py-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.button
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onProfileClick();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:text-amber-400 hover:bg-gradient-to-r from-amber-500/5 to-amber-500/10 transition-all duration-200 group"
                    >
                      <motion.div 
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/20 flex items-center justify-center group-hover:from-amber-500/20 group-hover:to-amber-500/30 group-hover:border-amber-500/40 transition-all duration-200"
                        whileHover={{ rotate: 5 }}
                      >
                        <User className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                      </motion.div>
                      <span className="font-medium">Profile</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsLinksModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:text-amber-400 hover:bg-gradient-to-r from-amber-500/5 to-amber-500/10 transition-all duration-200 group"
                    >
                      <motion.div 
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/20 flex items-center justify-center group-hover:from-amber-500/20 group-hover:to-amber-500/30 group-hover:border-amber-500/40 transition-all duration-200"
                        whileHover={{ rotate: 5 }}
                      >
                        <Link2 className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                      </motion.div>
                      <span className="font-medium">Useful Links</span>
                    </motion.button>
                    <motion.div 
                      className="h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5 my-2"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
          <motion.button
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-white/80 hover:text-red-400 hover:bg-gradient-to-r from-red-500/5 to-red-500/10 transition-all duration-200 group"
                    >
                      <motion.div 
                        className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500/10 to-red-500/20 border border-red-500/20 flex items-center justify-center group-hover:from-red-500/20 group-hover:to-red-500/30 group-hover:border-red-500/40 transition-all duration-200"
                        whileHover={{ rotate: 5 }}
                      >
                        <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                      </motion.div>
                      <span className="font-medium">Logout</span>
          </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isLinksModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start justify-center pt-20 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLinksModalOpen(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-black via-black/95 to-black/90 p-6 rounded-xl shadow-2xl border border-white/5 w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="flex items-center gap-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
                  whileHover={{ rotate: 5 }}
                >
                  <Link2 className="w-5 h-5 text-amber-500" />
                </motion.div>
                <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
                  Useful Links
                </h2>
              </motion.div>
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
    </motion.header>
  );
};

export default ChatHeader;