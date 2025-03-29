import express from 'express';
import UserChatController from '../controllers/UserChatController';
import authMiddleware from '../middleware/auth';
import uploadMiddleware from '../middleware/upload'; // Import the multer middleware
import { RequestHandler } from 'express';

const router = express.Router();

router.get('/history', authMiddleware as RequestHandler, UserChatController.getMyChatHistory);
router.post('/message', authMiddleware as RequestHandler, uploadMiddleware as RequestHandler, UserChatController.sendMessageToMyChat);

export default router;