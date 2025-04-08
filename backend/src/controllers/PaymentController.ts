import { Request, Response } from 'express';
import PaymentRequest from '../models/PaymentRequest';
import StorageService from '../services/StorageService';
import { io } from '../server';
import axios from 'axios';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';
const CASHFREE_API_URL = CASHFREE_ENV === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';
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

  async createOrder(req: Request, res: Response): Promise<void> {
    const { amount, currency, customer_id, customer_email, customer_phone, customer_name, return_url } = req.body;

    const requiredFields = ['amount', 'currency', 'customer_id', 'customer_email', 'customer_phone', 'customer_name', 'return_url'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
      return;
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      res.status(500).json({ success: false, error: 'Cashfree credentials not configured' });
      return;
    }

    const orderData = {
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id,
        customer_email,
        customer_phone,
        customer_name,
      },
      order_meta: {
        return_url,
      },
    };

    try {
      console.log('Creating Cashfree order with:', {
        url: `${CASHFREE_API_URL}/orders`,
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json',
        },
        body: orderData,
      });

      const response = await axios.post(`${CASHFREE_API_URL}/orders`, orderData, {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('Cashfree order created successfully:', response.data);
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error('Error creating Cashfree order:', error.response?.data || error.message);
      res.status(500).json({ 
        success: false, 
        error: error.response?.data?.message || 'Failed to create payment order' 
      });
    }
  }
}

export default new PaymentController();