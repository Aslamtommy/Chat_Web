import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserChat } from '../hooks/useUserCha'; // Fixed typo
import UserChatWindow from '../components/chat/UserChatWindow';
import MessageInput from '../components/chat/MessageInput';
import { motion, MotionProps } from 'framer-motion';

type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;
type MotionHeadingProps = MotionProps & React.HTMLAttributes<HTMLHeadingElement>;

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { messages, sendMessage } = useUserChat(user?._id.toString() || '');

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-accent flex items-center justify-center text-text-muted font-sans">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-lg"
          {...({} as MotionDivProps)}
        >
          Please log in to access the chat
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent">
      <header className="bg-gradient-to-r from-primary-dark to-primary text-white p-6 shadow-deep">
        <motion.h1
          className="text-3xl font-cinzel tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          {...({} as MotionHeadingProps)}
        >
          Expert Consultation
        </motion.h1>
      </header>
      <main className="max-w-4xl mx-auto py-12 px-6">
        <motion.div
          className="bg-white rounded-xl shadow-soft flex flex-col h-[600px] border border-accent-dark"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          {...({} as MotionDivProps)}
        >
          <div className="p-4 border-b border-accent-dark">
            <h2 className="text-lg font-medium text-primary">
              Chat with Our Astrology Experts
            </h2>
          </div>
          <UserChatWindow messages={messages as any[]} userId={user._id.toString()} />
          <MessageInput sendMessage={sendMessage} />
        </motion.div>
      </main>
    </div>
  );
};

export default ChatPage;