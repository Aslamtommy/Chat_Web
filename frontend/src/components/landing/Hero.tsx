// Hero.jsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import LoginModal from '../auth/LoginModal';
import RegisterModal from '../auth/RegisterModal';
import TermsModal from '../Modal/TermsModal';
import ContactUsModal from '../Modal/ContacUsModal';
const Hero = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleRegisterSuccess = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-stone-50 to-white">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1604014237800-1c9102c219da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3270&q=80" 
          alt="Classic Architecture" 
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/70 to-stone-900/90" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        <div className="container mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-3xl text-center"
            >
              <motion.h1 
                className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Discover Your Destiny Through{' '}
                <span className="text-amber-400">Arabic Jyothisham</span>
              </motion.h1>
              <motion.p 
                className="mx-auto mt-4 max-w-2xl text-base text-stone-200 sm:text-lg md:text-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Unlock the ancient wisdom of Arabic astrology and numerology to guide your life's journey
              </motion.p>
            </motion.div>

            <motion.div 
              className="mt-8 flex w-full max-w-sm flex-col items-center justify-center gap-3 sm:mt-10 sm:max-w-md sm:flex-row sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-white shadow-lg shadow-amber-500/20 transition-all duration-300 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/30 sm:w-auto"
              >
                <span className="relative">Sign In</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-full transform scale-0 rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-100" />
                </div>
              </button>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 sm:w-auto"
              >
                <span className="relative">Get Started</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-full transform scale-0 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-100" />
                </div>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer Links for Contact Us and Terms */}
        <motion.div
          className="container mx-auto px-4 py-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-white/70 hover:text-amber-400 font-sans text-sm transition-colors duration-300"
            >
              Contact Us
            </button>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="text-white/70 hover:text-amber-400 font-sans text-sm transition-colors duration-300"
            >
              Terms & Conditions
            </button>
          </div>
        </motion.div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
      <ContactUsModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
    </div>
  );
};

export default Hero;