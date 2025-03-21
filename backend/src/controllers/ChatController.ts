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
}

export default new ChatController();