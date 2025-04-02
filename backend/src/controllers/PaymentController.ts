import { Request, Response } from 'express';
import PaymentRequest from '../models/PaymentRequest';
import StorageService from '../services/StorageService';
import { io } from '../server';

class PaymentController {
  async createPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const { userId, paymentDetails } = req.body;
      const adminId = req.user?.id;
      if (!adminId) throw new Error('Admin not authenticated');
      if (!userId || !paymentDetails) throw new Error('Missing required fields');

      const paymentRequest = new PaymentRequest({
        userId,
        adminId,
        paymentDetails,
        status: 'pending',
      });
      await paymentRequest.save();

      io.to(userId).emit('paymentRequest', {
        paymentRequestId: paymentRequest._id,
        paymentDetails,
      });

      res.status(201).json({ success: true, data: paymentRequest });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserPaymentRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const paymentRequests = await PaymentRequest.find({ userId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: paymentRequests });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }

  async uploadScreenshot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file as Express.Multer.File | undefined;
      if (!file) throw new Error('No file uploaded');

      const paymentRequest = await PaymentRequest.findById(id);
      if (!paymentRequest) throw new Error('Payment request not found');
      if (paymentRequest.userId.toString() !== req.user?.id) throw new Error('Unauthorized');
      if (paymentRequest.status !== 'pending') throw new Error('Cannot upload screenshot for this request');

      const url = await StorageService.uploadFile(file, 'image');
      paymentRequest.screenshotUrl = url;
      paymentRequest.status = 'uploaded';
      await paymentRequest.save();

      io.to(paymentRequest.adminId.toString()).emit('screenshotUploaded', {
        paymentRequestId: paymentRequest._id,
        userId: paymentRequest.userId,
        screenshotUrl: url,
      });

      res.status(200).json({ success: true, data: paymentRequest });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }

  // Add this method to the existing PaymentController class
async getAdminPaymentRequests(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;
      if (!adminId) throw new Error('Admin not authenticated');
  
      const paymentRequests = await PaymentRequest.find({ adminId })
        .populate('userId', 'username') // Optionally populate user details
        .sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, data: paymentRequests });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new PaymentController();