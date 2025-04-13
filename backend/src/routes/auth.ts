// routes/authRoutes.ts
import express from 'express';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/auth';
import PaymentController from '../controllers/PaymentController';
import LinkController from '../controllers/LinkController';
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
router.post('/finalize-registration', AuthController.finalizeRegistration);
// Cashfree payment route
router.post('/create-order', PaymentController.createOrder);
router.get('/payment-requests', authMiddleware as RequestHandler, PaymentController.getUserPaymentRequests);
router.post('/payment-request/:id/upload', authMiddleware as RequestHandler, upload.single('file'), PaymentController.uploadScreenshot);
router.post('/buy-credits', authMiddleware as RequestHandler, PaymentController.buyCredits);
router.post('/finalize-credits', PaymentController.finalizeCredits);

router.get('/links', LinkController.getLinks);

// Token check endpoint for user
router.head('/check-token', authMiddleware as RequestHandler, (req: any, res: any) => {
  res.status(200).send(); // Return 200 OK if token is valid
});
export default router;