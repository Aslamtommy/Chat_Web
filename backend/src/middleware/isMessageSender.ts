import { Request, Response, NextFunction } from 'express';
import ChatThread from '../models/ChatThread';
import { IChatThread } from '../types';

// Extend the Request interface to include params and user
interface AuthenticatedRequest extends Request {
  params: { messageId: string };
  user: { id: string; role: string };
}

const isMessageSender = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Fetch the chat thread containing the message
    const chat = await ChatThread.findOne({ 'messages._id': messageId }).lean<IChatThread>();
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Find the message in the messages array
    const message = chat.messages.find((msg) => msg._id?.toString() === messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Check if the sender_id matches the userId
    if (message.sender_id.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'You can only edit or delete your own messages' });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export default isMessageSender;