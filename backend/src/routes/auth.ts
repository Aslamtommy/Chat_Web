import express from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';
const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authMiddleware as RequestHandler, AuthController.getCurrentUser); // Added route for getCurrentUser

export default router;