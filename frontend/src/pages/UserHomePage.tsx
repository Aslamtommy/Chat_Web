// UserHomePage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { motion, MotionProps } from 'framer-motion';

// Define type combinations for different HTML elements with MotionProps
type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;
type MotionHeadingProps = MotionProps & React.HTMLAttributes<HTMLHeadingElement>;
type MotionButtonProps = MotionProps & React.HTMLAttributes<HTMLButtonElement>;

const UserHomePage: React.FC = () => {
  const { user } = useAuth();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 font-sans">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-lg"
          {...({} as MotionDivProps)} // Type assertion
        >
          Please log in to continue
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-6 shadow-lg">
        <motion.h1 
          className="text-3xl font-serif tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          {...({} as MotionHeadingProps)} // Type assertion
        >
          Welcome, {user.username}
        </motion.h1>
      </header>
      <main className="max-w-4xl mx-auto py-12 px-6">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          {...({} as MotionDivProps)} // Type assertion
        >
          <h2 className="text-2xl font-serif text-indigo-900 mb-4 tracking-tight">
            Your Journey Begins Here
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed text-lg">
            At Arabic Jyothisham, we blend ancient astrological wisdom with modern insights 
            to guide you through life's mysteries. Explore your path in love, career, 
            and personal growth with our expert guidance.
          </p>
          <Link to="/chat">
            <motion.button 
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-6 py-3 rounded-lg shadow-md hover:from-yellow-700 hover:to-yellow-600 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              {...({} as MotionButtonProps)} // Type assertion
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span className="font-medium">Chat with Our Experts</span>
            </motion.button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default UserHomePage;