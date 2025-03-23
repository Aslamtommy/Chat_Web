import express from 'express';
import multer from 'multer';
import AuthController from '../controllers/AuthController';
import AdminAuthController from '../controllers/AdminAuthController';
import UploadController from '../controllers/UploadController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';
import { adminRoleMiddleware } from '../middleware/role';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', AuthController.register);
router.post('/login', (req, res) => {  // Removed 'next' from params
  console.log('POST /auth/login accessed');
  AuthController.login(req, res);      // Call with 2 args
});
router.post('/admin/login', AdminAuthController.adminLogin);
router.get('/me', authMiddleware as RequestHandler, AuthController.getCurrentUser);
router.put('/profile', authMiddleware as RequestHandler, AuthController.updateProfile);

router.post(
  '/upload/image',
  authMiddleware as RequestHandler,
  upload.single('image'),
  UploadController.uploadFile as RequestHandler
);
router.post(
  '/upload/audio',
  authMiddleware as RequestHandler,
  upload.single('audio'),
  UploadController.uploadFile as RequestHandler
);
router.get('/users', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.getUsers);
router.get('/users/:id', authMiddleware as RequestHandler, adminRoleMiddleware as RequestHandler, AdminAuthController.getUserById);

export default router;