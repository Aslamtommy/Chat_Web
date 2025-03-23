import express from 'express';
import UserChatController from '../controllers/UserChatController';
import AdminChatController from '../controllers/AdminChatController';
import authMiddleware from '../middleware/auth';
import { adminRoleMiddleware } from '../middleware/role';
import { RequestHandler } from 'express';
const router = express.Router();

// User-specific chat routes
router.get('/history', authMiddleware as RequestHandler , UserChatController.getMyChatHistory);
router.post('/message', authMiddleware as RequestHandler, UserChatController.sendMessageToMyChat);

// Admin-specific chat routes
router.get('/all', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminChatController.getAllChats);
router.get('/user/:userId/history', authMiddleware as  RequestHandler, adminRoleMiddleware as RequestHandler, AdminChatController.getUserChatHistory);
router.post('/user/:userId/message', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminChatController.sendMessageToUserChat);

export default router;