import { Request, Response } from 'express';
import ChatService from '../services/ChatService';
import StorageService from '../services/StorageService';
import { io } from '../server'; // Ensure io is exported from your server file (e.g., index.ts)
import ChatRepository from '../repositories/ChatRepository';

class UserChatController {
  async getMyChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const chat = await ChatService.getOrCreateChat(userId);
      res.json({ success: true, data: chat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async sendMessageToMyChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { messageType,duration } = req.body;
      let content: string;

      if (!messageType) throw new Error('messageType is required');
      if (!['text', 'image', 'voice'].includes(messageType)) throw new Error('Invalid messageType');

      if (messageType === 'text') {
        content = req.body.content;
        if (!content) throw new Error('content is required for text messages');
      } else {
        const file = req.file as Express.Multer.File | undefined;
        if (!file) throw new Error('File is required for image or voice messages');
        content = await StorageService.uploadFile(file, messageType);
      }

      console.log(`[sendMessageToMyChat] Saving message for user: ${userId}, content: ${content}`);
      const updatedChat = await ChatService.saveMessage(userId, userId, messageType, content,duration);
      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      if (!newMessage || !newMessage._id) {
        throw new Error('Message not saved properly');
      }
      console.log(`[sendMessageToMyChat] Message saved, ID: ${newMessage._id}`);

      // Emit real-time update via Socket.IO
      const messagePayload = {
        _id: newMessage._id.toString(),
        chatId: updatedChat._id.toString(),
        senderId: userId,
        content: newMessage.content,
        messageType: newMessage.message_type,
        timestamp: newMessage.timestamp,
        status: 'delivered',
        isAdmin: false,
        read: false,
      };

      io.to('admin-room').emit('newMessage', messagePayload);
      console.log(`[sendMessageToMyChat] Emitted newMessage for user: ${userId}`);

      // Update unread counts
      const unreadCount = await ChatRepository.getUnreadCount(userId);
      io.to('admin-room').emit('updateUnreadCount', {
        userId,
        unreadCount,
      });
      console.log(`[sendMessageToMyChat] Emitted updateUnreadCount for user: ${userId}, count: ${unreadCount}`);

      // Emit updateUserOrder for real-time sorting
      io.to('admin-room').emit('updateUserOrder', {
        userId,
        timestamp: newMessage.timestamp,
      });
      console.log(`[sendMessageToMyChat] Emitted updateUserOrder for user: ${userId}, timestamp: ${newMessage.timestamp}`);

      res.json({ success: true, data: updatedChat });
    } catch (error) {
      console.error(`[sendMessageToMyChat] Error: ${(error as Error).message}`);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new UserChatController();