import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import api from '../services/api';
import { IChatThread } from '../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<IChatThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { messages, sendMessage } = useChat(selectedUserId || '');

  useEffect(() => {
    const fetchThreads = async () => {
      const { data }: any = await api.get('/chat/all');
      setThreads(data);
    };
    if (user?.role === 'admin') fetchThreads();
  }, [user]);

  if (!user || user.role !== 'admin') return <div>Admins only</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user.username} ({user.email})
        </h1>
      </div>
      <div className="flex flex-1 m-6 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto border-r">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Chat Threads</h2>
          {threads.map((thread) => (
            <div
              key={thread._id}
              onClick={() => setSelectedUserId(thread.user_id)}
              className={`p-3 cursor-pointer rounded-lg ${
                selectedUserId === thread.user_id
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              User: {thread.user_id}
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              <h2 className="p-4 text-xl font-semibold text-gray-700">
                Chat with User {selectedUserId}
              </h2>
              <ChatWindow messages={messages} userId={user._id} />
              <MessageInput sendMessage={sendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a thread to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;