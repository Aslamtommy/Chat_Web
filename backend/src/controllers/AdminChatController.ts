import { Request, Response } from 'express';
import ChatService from '../services/ChatService';
import mongoose from 'mongoose';

class AdminChatController {
  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      console.log('adminchatcontroll first')
      const chats = await ChatService.getAllChats();
      console.log('adminchatcontroll after')
      res.json({ success: true, data: chats });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      // Validate userId as a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ success: false, error: 'Invalid user ID' });
        return
      }
      const chat = await ChatService.getOrCreateChat(userId);
      res.json({ success: true, data: chat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async sendMessageToUserChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
       res.status(400).json({ success: false, error: 'Invalid user ID' });
       return
      }
      const senderId = req.user!.id;
      const { messageType, content } = req.body;
      const updatedChat = await ChatService.saveMessage(userId, senderId, messageType, content);
      res.json({ success: true, data: updatedChat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new AdminChatController();