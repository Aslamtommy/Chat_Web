import express from 'express';
import multer from 'multer';
import AuthController from '../controllers/AuthController';
import AdminAuthController from '../controllers/AdminAuthController';
import UploadController from '../controllers/UploadController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authentication routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/admin/login', AdminAuthController.adminLogin);
router.get('/me', authMiddleware as RequestHandler, AuthController.getCurrentUser);

// Upload routes
router.post(
    '/image',
    authMiddleware as RequestHandler,
    upload.single('file'),
    UploadController.uploadFile as RequestHandler
  );
  router.post(
    '/audio',
    authMiddleware as RequestHandler,
    upload.single('file'),
    UploadController.uploadFile as RequestHandler
  );
export default router;