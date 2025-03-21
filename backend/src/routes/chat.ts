// chatRoutes.ts
import express from 'express';
import ChatController from '../controllers/ChatController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';

const router = express.Router();

router.get('/history/:userId', authMiddleware as RequestHandler, ChatController.getChatHistory);
router.get('/all', authMiddleware as RequestHandler, ChatController.getAllChats);
router.post('/message', authMiddleware as RequestHandler, ChatController.sendMessage);

export default router;