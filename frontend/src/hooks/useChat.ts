import { useState, useEffect } from 'react';
import socket from '../services/socket';
import { IMessage } from '../types';
import api from '../services/api';

export const useChat = (userId: string) => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    socket.emit('joinChat', userId);

    socket.on('receiveMessage', (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [userId]);

  const sendMessage = async (message: string | File, messageType: 'text' | 'image') => {
    if (messageType === 'image' && message instanceof File) {
      const formData = new FormData();
      formData.append('image', message);
      const { data }:any = await api.post('/upload/image', formData); // Adjust endpoint as needed
      socket.emit('sendMessage', {
        userId,
        senderId: userId,
        message: data.url,
        messageType,
      });
    } else if (typeof message === 'string') {
      socket.emit('sendMessage', { userId, senderId: userId, message, messageType });
    }
  };

  return { messages, sendMessage };
};