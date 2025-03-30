 
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import { IoClose } from 'react-icons/io5';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm transform rounded-2xl sm:max-w-md">
              <div className="overflow-hidden rounded-2xl bg-white/10 shadow-glass backdrop-blur-2xl">
                <div className="relative px-4 pt-6 sm:px-6 sm:pt-8">
                  <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
                  >
                    <IoClose size={20} />
                  </button>

                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.div 
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 shadow-glass-sm backdrop-blur-xl sm:h-20 sm:w-20"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <span className="animate-float text-3xl sm:text-4xl">✨</span>
                    </motion.div>
                    <h2 className="mb-1 font-serif text-2xl font-medium tracking-tight text-white sm:text-3xl">
                      Welcome Back
                    </h2>
                    <p className="text-sm text-stone-200 sm:text-base">
                      Sign in to continue your spiritual journey
                    </p>
                  </motion.div>
                </div>

                <div className="px-4 pb-6 sm:px-6 sm:pb-8">
                  <Login onSuccess={onClose} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;