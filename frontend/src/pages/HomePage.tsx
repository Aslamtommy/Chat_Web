import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import api from '../services/api';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(user?._id || '');

  useEffect(() => {
    const fetchChat = async () => {
      if (user) {
        const { data } = await api.get(`/chat/history/${user._id}`);

        console.log(data)
        // Optionally set initial messages if needed
      }
    };
    if (user) fetchChat();
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
      Please log in to access the chat.
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-lg p-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          Welcome, <span className="text-blue-600">{user.username}</span>
          <span className="text-gray-500 text-sm ml-2">({user.email})</span>
        </h1>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full my-8 px-4">
        <div className="bg-white rounded-xl shadow-md flex flex-col h-[calc(100vh-12rem)]">
          <ChatWindow messages={messages} userId={user._id} />
          <MessageInput sendMessage={sendMessage} />
        </div>
      </main>
    </div>
  );
};

export default HomePage;