// ContactUsModal.jsx
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, X } from 'lucide-react';

const ContactUsModal = ({ isOpen, onClose }:{isOpen:any, onClose :any}) => {
  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative max-w-lg w-full bg-black/80 backdrop-blur-md border border-amber-500/20 rounded-xl p-6 text-white font-serif"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-amber-500"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-amber-500 mb-4">Contact Us</h2>
        <p className="text-sm text-white/70 mb-6">Reach out to us for any inquiries</p>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <strong className="text-white">Address:</strong>
              <p className="text-white/80">Mullal, Alattil - Periya Road, Manathavady, Kerala, PIN: 670644</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <strong className="text-white">Phone:</strong>
              <p className="text-white/80">8921665542</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <strong className="text-white">Email:</strong>
              <p className="text-white/80">moulaviusman78@gmail.com</p>
            </div>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ContactUsModal;