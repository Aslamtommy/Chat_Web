import { motion, AnimatePresence } from 'framer-motion';
import Register from './Register';
import { IoClose } from 'react-icons/io5';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void; // Added prop to handle successful registration
}

const RegisterModal = ({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) => {
  // Handler to close modal and trigger success callback
  const handleRegisterSuccess = () => {
    onClose(); // Close the register modal
    onRegisterSuccess?.(); // Trigger the success callback to open login modal
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            {/* Modal Content */}
            <div className="relative w-full max-w-[95%] sm:max-w-md transform rounded-2xl my-4 sm:my-8 max-h-[90vh] flex flex-col">
              <div className="overflow-hidden rounded-2xl bg-white/10 shadow-glass backdrop-blur-2xl flex flex-col">
                {/* Modal Header */}
                <div className="relative px-3 pt-4 sm:px-6 sm:pt-6 flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="absolute right-2 top-2 sm:right-3 sm:top-3 text-white/70 hover:text-white transition-colors"
                  >
                    <IoClose size={20} />
                  </button>

                  {/* Welcome Message */}
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.div 
                      className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/10 shadow-glass-sm backdrop-blur-xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <span className="animate-float text-2xl sm:text-3xl">🌟</span>
                    </motion.div>
                    <h2 className="mb-1 font-serif text-xl sm:text-2xl font-medium tracking-tight text-white">
                      Begin Your Journey
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-200">
                      Create your account to start your spiritual exploration
                    </p>
                  </motion.div>
                </div>

                {/* Register Form */}
                <div className="px-3 pb-4 sm:px-6 sm:pb-6 overflow-y-auto flex-1">
                  <Register onSuccess={handleRegisterSuccess} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RegisterModal;