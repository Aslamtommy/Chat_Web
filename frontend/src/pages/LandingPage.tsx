import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, MotionProps } from 'framer-motion';
import Button from '../components/common/Button';

type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.4, delayChildren: 0.2 },
    },
  };

  const pulse = {
    scale: [1, 1.2, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-950 to-black text-white bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent"></div>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="w-1 h-1 bg-yellow-200 rounded-full absolute top-1/5 left-1/4"
          animate={pulse}
          {...({} as MotionDivProps)}
        />
        <motion.div
          className="w-2 h-2 bg-white rounded-full absolute top-1/3 right-1/5"
          animate={{ ...pulse, transition: { ...pulse.transition, delay: 0.5 } }}
          {...({} as MotionDivProps)}
        />
        <motion.div
          className="w-1.5 h-1.5 bg-yellow-300 rounded-full absolute bottom-1/4 left-2/3"
          animate={{ ...pulse, transition: { ...pulse.transition, delay: 1 } }}
          {...({} as MotionDivProps)}
        />
      </div>
      <motion.div
        className="relative z-10 text-center px-8 py-20 max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        {...({} as MotionDivProps)}
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-wide leading-tight font-cinzel text-yellow-50 drop-shadow-lg"
          variants={fadeInUp}
          {...({} as MotionProps & React.HTMLAttributes<HTMLHeadingElement>)}
        >
          Arabic Jyothisham
        </motion.h1>
        <motion.h2
          className="text-2xl md:text-4xl lg:text-5xl font-light mb-8 text-gray-100 tracking-wide"
          variants={fadeInUp}
          {...({} as MotionProps & React.HTMLAttributes<HTMLHeadingElement>)}
        >
          Celestial Insights for Modern Souls
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl lg:text-2xl font-light mb-12 max-w-4xl mx-auto leading-relaxed text-gray-200"
          variants={fadeInUp}
          {...({} as MotionProps & React.HTMLAttributes<HTMLParagraphElement>)}
        >
          Embark on a journey through love, career, health, and prosperity, guided by the ancient wisdom of Arabic astrology—crafted for today’s seekers.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8"
          variants={fadeInUp}
          {...({} as MotionDivProps)}
        >
          <Button
            onClick={() => navigate('/register')}
            className="px-10 py-4 text-lg md:text-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 transition-all duration-500 shadow-xl rounded-full font-semibold tracking-wide hover:shadow-2xl"
          >
            Start Your Journey
          </Button>
          <Button
            onClick={() => navigate('/login')}
            className="px-10 py-4 text-lg md:text-xl bg-transparent border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900 transition-all duration-500 shadow-xl rounded-full font-semibold tracking-wide hover:shadow-2xl"
          >
            Sign In
          </Button>
        </motion.div>
        <motion.p
          className="mt-12 text-sm md:text-base lg:text-lg font-light text-gray-300 italic tracking-wide"
          variants={fadeInUp}
          {...({} as MotionProps & React.HTMLAttributes<HTMLParagraphElement>)}
        >
          "Where the stars align with your destiny."
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LandingPage;