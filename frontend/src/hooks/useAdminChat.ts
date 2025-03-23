// hooks/useAdminChat.tsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useAdminChat = (selectedUserId: string | null) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch all chat threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        console.log('Fetching threads from /chat/all');
        const response: any = await api.get('/chat/all');
        console.log('Raw API Response (Threads):', response.data); // Log full response
        if (response.data.success) {
          const fetchedThreads = response.data.data || [];
          console.log('Processed Threads:', fetchedThreads); // Log processed threads
          fetchedThreads.forEach((thread: any, index: number) => {
            console.log(`Thread ${index} User Data:`, thread.user_id); // Log each user_id
          });
          setThreads(fetchedThreads);
        } else {
          toast.error(response.data.error || 'Failed to fetch chat threads');
          setThreads([]);
        }
      } catch (error) {
        toast.error(`Failed to fetch chat threads: ${(error as Error).message}`);
        setThreads([]);
      }
    };
    fetchThreads();
  }, []);

  // Fetch messages for the selected user
  useEffect(() => {
    if (!selectedUserId || selectedUserId === 'unknown') {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        console.log(`Fetching messages for user ID: ${selectedUserId} from /chat/user/${selectedUserId}/history`);
        const response: any = await api.get(`/chat/user/${selectedUserId}/history`);
        console.log('Raw API Response (Messages):', response.data); // Log full response
        if (response.data.success) {
          const fetchedMessages = response.data.data.messages || [];
          console.log('Processed Messages:', fetchedMessages); // Log processed messages
          console.log('User Data from Messages Thread:', response.data.data.user_id); // Log user_id from thread
          setMessages(fetchedMessages);
        } else {
          toast.error(response.data.error || 'Failed to fetch messages');
          setMessages([]);
        }
      } catch (error) {
        toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        setMessages([]);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount or selectedUserId change
  }, [selectedUserId]);

  // Send a message (text, image, or voice)
  const sendMessage = async (message: any, messageType: any) => {
    if (!selectedUserId || selectedUserId === 'unknown') return;

    try {
      let content: any;
      if (message instanceof File) {
        const formData = new FormData();
        formData.append(messageType === 'image' ? 'image' : 'audio', message);
        const endpoint = messageType === 'image' ? '/upload/image' : '/upload/audio';
        console.log(`Uploading file to ${endpoint}`);
        const uploadResponse: any = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('Upload Response:', uploadResponse.data); // Log upload response
        if (uploadResponse.data.success) {
          content = uploadResponse.data.data.url;
          console.log('Uploaded Content URL:', content);
        } else {
          throw new Error(uploadResponse.data.error || 'Upload failed');
        }
      } else {
        content = message;
        console.log('Text Content to Send:', content);
      }

      console.log(`Sending message to /chat/user/${selectedUserId}/message`, { messageType, content });
      const sendResponse: any = await api.post(`/chat/user/${selectedUserId}/message`, {
        messageType,
        content,
      });
      console.log('Send Message Response:', sendResponse.data); // Log send response
      if (sendResponse.data.success) {
        const updatedMessages = sendResponse.data.data.messages || [];
        console.log('Updated Messages:', updatedMessages); // Log updated messages
        console.log('User Data from Send Response:', sendResponse.data.data.user_id); // Log user_id from response
        setMessages(updatedMessages);
        toast.success('Message sent successfully');
      } else {
        throw new Error(sendResponse.data.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error(`Failed to send message: ${(error as Error).message}`);
    }
  };

  return { threads, messages, sendMessage };
};