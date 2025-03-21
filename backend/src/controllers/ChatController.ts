// ChatController.ts
import { Request, Response } from 'express';
import ChatService from '../services/ChatService';

class ChatController {
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const chat = await ChatService.getOrCreateChat(req.params.userId);
      res.json(chat);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admins only' });
        return;
      }
      const chats = await ChatService.getAllChats();
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { userId, messageType, content } = req.body;
      const senderId = req.user!.id; // Set by authMiddleware

      // Restrict regular users to their own chat thread
      if (req.user!.role !== 'admin' && userId !== req.user!.id) {
        throw new Error('You can only send messages to your own chat thread');
      }

      const updatedChat = await ChatService.saveMessage(userId, senderId, messageType, content);
      res.json(updatedChat);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default new ChatController();