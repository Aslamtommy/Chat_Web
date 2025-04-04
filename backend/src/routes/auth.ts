// routes/authRoutes.ts
import express from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/auth';
import PaymentController from '../controllers/PaymentController';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
import { RequestHandler } from 'express';
router.post('/register', AuthController.register);
router.post('/login', (req, res) => {
  
  AuthController.login(req, res);
});
router.get('/me', authMiddleware as RequestHandler, AuthController.getCurrentUser);
router.put('/profile', authMiddleware as RequestHandler, AuthController.updateProfile);

router.get('/payment-requests', authMiddleware as RequestHandler, PaymentController.getUserPaymentRequests);
router.post('/payment-request/:id/upload', authMiddleware as RequestHandler, upload.single('file'), PaymentController.uploadScreenshot);

export default router;