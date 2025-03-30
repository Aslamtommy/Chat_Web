import { Request, Response } from 'express';
import ChatService from '../services/ChatService';
import StorageService from '../services/StorageService';
import { io } from '../server';
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
      const { messageType } = req.body;
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

      const updatedChat = await ChatService.saveMessage(userId, userId, messageType, content);

      // Emit real-time update via Socket.io
      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      if (!newMessage || !newMessage._id) {
        throw new Error('Message not saved properly');
      }
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

      // Update unread counts
      const unreadCount = await ChatRepository.getUnreadCount(userId);
      io.to('admin-room').emit('updateUnreadCount', {
        userId,
        unreadCount,
      });

      res.json({ success: true, data: updatedChat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new UserChatController();