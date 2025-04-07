 
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactUs = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.2, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white font-serif flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-serif text-white tracking-wide">
            Arabic Jyothisham
          </h1>
          <button
            onClick={() => navigate('/home')}
            className="text-amber-500 hover:text-amber-400 font-sans text-sm"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-4">
            Contact Us
          </h2>
          <p className="text-sm sm:text-base text-white/70 mb-6">
            Last updated on 07-04-2025 20:25:56
          </p>
          <p className="text-sm sm:text-base text-white/90 mb-6">
            You may contact us using the information below:
          </p>

          <motion.ul
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.li variants={itemVariants} className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <strong className="text-white">Registered Address:</strong>
                <p className="text-white/80">
                  Mullal, Alattil - Periya Road, Manathavady, Kerala, PIN: 670644
                </p>
              </div>
            </motion.li>
            <motion.li variants={itemVariants} className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <strong className="text-white">Operational Address:</strong>
                <p className="text-white/80">
                  Mullal, Alattil - Periya Road, Manathavady, Kerala, PIN: 670644
                </p>
              </div>
            </motion.li>
            <motion.li variants={itemVariants} className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <strong className="text-white">Telephone No:</strong>
                <p className="text-white/80">8921665542</p>
              </div>
            </motion.li>
            <motion.li variants={itemVariants} className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <strong className="text-white">E-Mail ID:</strong>
                <p className="text-white/80">moulaviusman78@gmail.com</p>
              </div>
            </motion.li>
          </motion.ul>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;