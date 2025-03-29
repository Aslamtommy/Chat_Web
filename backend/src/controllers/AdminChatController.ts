import { Request, Response } from 'express';
import ChatService from '../services/ChatService';
import StorageService from '../services/StorageService';
import ChatRepository from '../repositories/ChatRepository';

class AdminChatController {
  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const chats = await ChatService.getAllChats();
      res.json({ success: true, data: chats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUnreadCounts(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) throw new Error('Admin ID not found');

      const unreadCounts = await ChatRepository.getUnreadCounts(adminId);
      res.json({ success: true, data: unreadCounts });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async getUserChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) throw new Error('Admin ID not found');

      const chat = await ChatRepository.findByUserId(userId);
      if (!chat) {
        res.json({ success: true, data: { messages: [] } });
        return;
      }
      
      res.json({ success: true, data: chat });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;
      
      if (!adminId) throw new Error('Admin ID not found');
      
      await ChatRepository.markMessagesAsRead(userId, adminId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  async sendMessageToUserChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const senderId = req.user!.id;
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
        content = await StorageService.uploadFile(file, messageType === 'image' ? 'image' : 'audio');
      }

      const updatedChat = await ChatService.saveMessage(userId, senderId, messageType, content);
      res.json({ success: true, data: updatedChat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new AdminChatController();