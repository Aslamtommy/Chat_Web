// routes/uploadRoutes.ts
import express from 'express';
import multer from 'multer';
import UploadController from '../controllers/UploadController';
import authMiddleware from '../middleware/auth';
import { RequestHandler } from 'express';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/image', authMiddleware as RequestHandler, upload.single('file'), UploadController.uploadFile);
router.post('/audio', authMiddleware as RequestHandler, upload.single('file'), UploadController.uploadFile);

export default router;