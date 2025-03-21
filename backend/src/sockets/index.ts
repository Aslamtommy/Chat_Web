import { Server, Socket } from 'socket.io';
import ChatService from '../services/ChatService';
import StorageService from '../services/StorageService';

interface SocketMessage {
  userId: string;
  senderId: string;
  message: any;
  messageType: 'text' | 'image';
}

export default (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    socket.on('joinChat', (userId: string) => {
      socket.join(`chat_${userId}`);
    });

    socket.on('sendMessage', async ({ userId, senderId, message, messageType }: SocketMessage) => {
      let content: string = message;
      if (messageType === 'image') {
        content = await StorageService.uploadImage(message);
      }
      const updatedChat = await ChatService.saveMessage(userId, senderId, messageType, content);
      io.to(`chat_${userId}`).emit('receiveMessage', updatedChat.messages.slice(-1)[0]);
    });
  });
};