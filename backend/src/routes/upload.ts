import express from 'express';
import UploadController from '../controllers/UploadController';
import authMiddleware from '../middleware/auth';
import uploadMiddleware from '../middleware/upload';
import { RequestHandler } from 'express'; 
const router = express.Router();

router.post('/image', authMiddleware as RequestHandler, uploadMiddleware, UploadController.uploadImage);

export default router;