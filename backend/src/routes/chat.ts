import express from 'express';
import UserChatController from '../controllers/UserChatController';
import authMiddleware from '../middleware/auth';
import uploadMiddleware from '../middleware/upload';
import isMessageSender from '../middleware/isMessageSender'; // Import the new middleware
import ChatService from '../services/ChatService';
import { RequestHandler } from 'express';

const router = express.Router();

router.get('/history', authMiddleware as RequestHandler, UserChatController.getMyChatHistory);
router.post('/message', authMiddleware as RequestHandler, uploadMiddleware as RequestHandler, UserChatController.sendMessageToMyChat);

// Add edit and delete routes
router.put('/message/:messageId', authMiddleware as RequestHandler, isMessageSender as RequestHandler, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    if (!content) throw new Error('Content is required');
    const updatedMessage = await ChatService.editMessage(messageId, content);
    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/message/:messageId', authMiddleware as RequestHandler, isMessageSender as RequestHandler, async (req, res) => {
  try {
    const { messageId } = req.params;
    await ChatService.deleteMessage(messageId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;