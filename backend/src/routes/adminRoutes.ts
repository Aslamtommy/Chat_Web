import express from 'express';
import AdminAuthController from '../controllers/AdminAuthController';
import AdminChatController from '../controllers/AdminChatController';
import authMiddleware from '../middleware/auth';
import { adminRoleMiddleware } from '../middleware/role';
import { validateUserId } from '../middleware/validateUserId';
import uploadMiddleware from '../middleware/upload';
import { RequestHandler } from 'express';

const router = express.Router();

router.post('/auth/login', AdminAuthController.adminLogin);
router.get('/users', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.getUsers);
router.get('/users/with-last-message', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.getUsersWithLastMessage);
router.get('/users/:id', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.getUserById);
router.get('/chats', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminChatController.getAllChats);
router.get('/chats/user/:userId', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, validateUserId as RequestHandler, AdminChatController.getUserChatHistory);
router.post('/chats/user/:userId/message', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, validateUserId as RequestHandler, uploadMiddleware as RequestHandler, AdminChatController.sendMessageToUserChat);
router.get('/chats/unread-counts', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminChatController.getUnreadCounts);
router.post('/chats/user/:userId/mark-read', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, validateUserId as RequestHandler, AdminChatController.markMessagesAsRead);

export default router;