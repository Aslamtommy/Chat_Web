import express from 'express';
import AdminAuthController from '../controllers/AdminAuthController';
import AdminChatController from '../controllers/AdminChatController';
import authMiddleware from '../middleware/auth';
import { adminRoleMiddleware } from '../middleware/role';
import { validateUserId } from '../middleware/validateUserId';
import uploadMiddleware from '../middleware/upload';
import { RequestHandler } from 'express';
import PaymentController from '../controllers/PaymentController';
import LinkController from '../controllers/LinkController';
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
router.post('/payment-request', authMiddleware as RequestHandler, PaymentController.createPaymentRequest);
router.get('/payment-requests', authMiddleware as RequestHandler, PaymentController.getAdminPaymentRequests);
router.delete('/users/:id', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.deleteUser); // Added DELETE route

// Link Management Routes (Admin-only)
router.get('/links', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, LinkController.getLinks);
router.post('/links', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, LinkController.createLink);
router.put('/links/:id', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, LinkController.updateLink);
router.delete('/links/:id', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, LinkController.deleteLink);

// Token check endpoint
router.head('/check-token', authMiddleware as RequestHandler, (req: any, res: any) => {
    // If authMiddleware passes, the token is valid
    res.status(200).send(); // Return 200 OK if token is valid
  });
  
export default router;
