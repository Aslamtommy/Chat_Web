import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useAdminChat = (selectedUserId: string | null) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true); // Add loading state for threads
  const [messagesLoading, setMessagesLoading] = useState(false); // Add loading state for messages

  // Fetch all chat threads
  useEffect(() => {
    const fetchThreads = async () => {
      setThreadsLoading(true);
      try {
        const response: any = await api.get('/chat/all');
        if (response.data.success) {
          const fetchedThreads = response.data.data || [];
          setThreads(fetchedThreads);
        } else {
          toast.error(response.data.error || 'Failed to fetch chat threads');
          setThreads([]);
        }
      } catch (error) {
        toast.error(`Failed to fetch chat threads: ${(error as Error).message}`);
        setThreads([]);
      } finally {
        setThreadsLoading(false);
      }
    };
    fetchThreads();
  }, []);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!selectedUserId || selectedUserId === 'unknown') {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response: any = await api.get(`/chat/user/${selectedUserId}/history`);
        if (response.data.success) {
          const fetchedMessages = response.data.data.messages || [];
          setMessages(fetchedMessages);
        } else {
          toast.error(response.data.error || 'Failed to fetch messages');
          setMessages([]);
        }
      } catch (error) {
        toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount or selectedUserId change
  }, [selectedUserId]);

  // Send a message (text, image, or voice)
  const sendMessage = async (message: string | File, messageType: 'text' | 'image' | 'voice') => {
    if (!selectedUserId || selectedUserId === 'unknown') return;

    try {
      let content: string;
      if (message instanceof File) {
        const formData = new FormData();
        formData.append(messageType === 'image' ? 'image' : 'audio', message);
        const endpoint = messageType === 'image' ? '/upload/image' : '/upload/audio';
        const uploadResponse: any = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (uploadResponse.data.success) {
          content = uploadResponse.data.data.url;
        } else {
          throw new Error(uploadResponse.data.error || 'Upload failed');
        }
      } else {
        content = message;
      }

      const sendResponse: any = await api.post(`/chat/user/${selectedUserId}/message`, {
        messageType,
        content,
      });
      if (sendResponse.data.success) {
        setMessages(sendResponse.data.data.messages || []);
        toast.success('Message sent successfully');
      } else {
        throw new Error(sendResponse.data.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error(`Failed to send message: ${(error as Error).message}`);
    }
  };

  return { threads, messages, sendMessage, threadsLoading, messagesLoading };
};