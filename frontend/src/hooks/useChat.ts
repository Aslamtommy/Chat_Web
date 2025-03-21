// useChat.ts
import { useState, useEffect } from 'react';
import api from '../services/api';
import { IMessage } from '../types';

export const useChat = (userId: string) => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    if (!userId) return; // Skip if no userId (e.g., AdminDashboard before selection)

    const fetchMessages = async () => {
      try {
        const { data } :any= await api.get(`/chat/history/${userId}`);
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount or userId change
  }, [userId]);

  const sendMessage = async (message: string | File, messageType: 'text' | 'image') => {
    if (!userId) return;

    try {
      let content: string;
      if (messageType === 'image' && message instanceof File) {
        const formData = new FormData();
        formData.append('image', message);
        const { data } :any= await api.post('/upload/image', formData);
        content = data.url;
      } else {
        content = message as string;
      }

      await api.post('/chat/message', { userId, messageType, content });
      // Fetch updated messages immediately after sending
      const { data }:any = await api.get(`/chat/history/${userId}`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage };
};