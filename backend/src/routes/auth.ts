// routes/authRoutes.ts
import express from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/auth';

const router = express.Router();
import { RequestHandler } from 'express';
router.post('/register', AuthController.register);
router.post('/login', (req, res) => {
  
  AuthController.login(req, res);
});
router.get('/me', authMiddleware as RequestHandler, AuthController.getCurrentUser);
router.put('/profile', authMiddleware as RequestHandler, AuthController.updateProfile);

export default router;