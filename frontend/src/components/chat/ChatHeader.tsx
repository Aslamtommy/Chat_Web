import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquareText, User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';

interface ChatHeaderProps {
  onProfileClick: () => void; // Prop to trigger profile modal
}

const ChatHeader = ({ onProfileClick }: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotification();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Animation variants for buttons
  const buttonVariants = {
    initial: { scale: 1, translateZ: 0, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)' },
    hover: {
      scale: 1.1,
      translateZ: 10, // Moves forward in 3D space
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

  return (
    <header className="px-4 py-3 sm:px-6 sm:py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Chat Title with Icon */}
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

        {/* Actions: Notification, Profile, and Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Button */}
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate('/notifications')}
            className="relative flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }} // Enable 3D transforms
          >
            <Bell className="w-5 h-5 group-hover:stroke-amber-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
            <span className="text-sm font-medium hidden sm:inline">Notifications</span>
          </motion.button>

          {/* Profile Button */}
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={onProfileClick}
            className="flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }} // Enable 3D transforms
          >
            <User className="w-5 h-5 group-hover:stroke-amber-500" />
            <span className="text-sm font-medium hidden sm:inline">Profile</span>
          </motion.button>

          {/* Logout Button */}
          <motion.button
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/70 hover:text-amber-500 font-sans px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 group"
            style={{ transformStyle: 'preserve-3d' }} // Enable 3D transforms
          >
            <LogOut className="w-5 h-5 group-hover:stroke-amber-500" />
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;