import { Request, Response } from 'express';
import ChatService from '../services/ChatService';

class UserChatController {
  // Get the authenticated user's chat history
  async getMyChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id; // Authenticated user's ID
      const chat = await ChatService.getOrCreateChat(userId);
      res.json({ success: true, data: chat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // Send a message to the authenticated user's own chat thread
  async sendMessageToMyChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id; // Authenticated user's ID as both sender and chat owner
      const { messageType, content } = req.body;
      const updatedChat = await ChatService.saveMessage(userId, userId, messageType, content);
      res.json({ success: true, data: updatedChat });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new UserChatController();