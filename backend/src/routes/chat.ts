import express from 'express';
import ChatController from '../controllers/ChatController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';  // Import RequestHandler

const router = express.Router();

// Cast authMiddleware to RequestHandler
router.get('/history/:userId', authMiddleware as RequestHandler, ChatController.getChatHistory);
router.get('/all', authMiddleware as RequestHandler, ChatController.getAllChats);

export default router;
