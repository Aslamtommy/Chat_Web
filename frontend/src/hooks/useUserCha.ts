import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useUserChat = (userId: string) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      try {
        const { data }: any = await api.get('/chat/history');
        if (data.success) {
          setMessages(data.data.messages || []);
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        toast.error('Failed to fetch messages');
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const sendMessage = async (message: string | File, messageType: 'text' | 'image' | 'voice') => {
    if (!userId) return;

    try {
      let content: string;
      if (message instanceof File) {
        const formData = new FormData();
        // Append the file based on message type
        formData.append(messageType === 'image' ? 'image' : 'audio', message);
        // Use the appropriate endpoint for image or audio
        const endpoint = messageType === 'image' ? '/upload/image' : '/upload/audio';
        const { data }: any = await api.post(endpoint, formData);
        if (data.success) {
          content = data.data.url;
        } else {
          throw new Error(data.error);
        }
      } else {
        content = message as string; // For text messages
      }

      const sendResponse: any = await api.post('/chat/message', { messageType, content });
      if (sendResponse.data.success) {
        setMessages(sendResponse.data.data.messages || []);
        toast.success('Message sent successfully');
      } else {
        toast.error(sendResponse.data.error);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return { messages, sendMessage };
};