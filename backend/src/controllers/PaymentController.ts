import { Request, Response } from 'express';
import PaymentRequest from '../models/PaymentRequest';
import StorageService from '../services/StorageService';
import { io } from '../server';
import axios from 'axios';
import Payment from '../models/payment';
import AuthService from '../services/AuthService';
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
    console.log('[PaymentController.createOrder] Request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });

    const { amount, currency, customer_id, customer_email, customer_phone, customer_name, return_url } = req.body;

    console.log('[PaymentController.createOrder] Extracted body fields:', {
      amount,
      currency,
      customer_id,
      customer_email,
      customer_phone,
      customer_name,
      return_url,
    });

    const requiredFields = ['amount', 'currency', 'customer_id', 'customer_email', 'customer_phone', 'customer_name', 'return_url'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      console.log('[PaymentController.createOrder] Validation failed - Missing fields:', missingFields);
      res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
      return;
    }

    console.log('[PaymentController.createOrder] All required fields present');

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.log('[PaymentController.createOrder] Cashfree credentials missing:', {
        CASHFREE_APP_ID: !!CASHFREE_APP_ID,
        CASHFREE_SECRET_KEY: !!CASHFREE_SECRET_KEY,
      });
      res.status(500).json({ success: false, error: 'Cashfree credentials not configured' });
      return;
    }

    console.log('[PaymentController.createOrder] Cashfree credentials found');

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

    console.log('[PaymentController.createOrder] Prepared order data for Cashfree:', orderData);

    try {
      console.log('[PaymentController.createOrder] Sending request to Cashfree:', {
        url: `${CASHFREE_API_URL}/orders`,
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': '[REDACTED]', // Avoid logging sensitive data
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

      console.log('[PaymentController.createOrder] Cashfree response received:', response.data);
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error('[PaymentController.createOrder] Error creating Cashfree order:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      res.status(500).json({
        success: false,
        error: error.response?.data?.message || 'Failed to create payment order',
      });
    }
  }
  async buyCredits(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new Error('User not authenticated');

    const sanitizedCustomerId = userId;
    const user = await AuthService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const response = await axios.post(`${CASHFREE_API_URL}/orders`, {
      order_amount: 499, // Rs. 499 for 20 credits
      order_currency: 'INR',
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_email: user.email,
        customer_phone: user.phoneNo,
        customer_name: user.username,
      },
      order_meta: { return_url: `${req.headers.origin}/payment-success-credits?userId=${userId}` },
    }, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    });

    res.json({ success: true, data: response.data });
  }

  async finalizeCredits(req: Request, res: Response): Promise<void> {
    console.log('[PaymentController.finalizeCredits] Request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    });

    try {
      const { userId, amount } = req.body;
      console.log('[PaymentController.finalizeCredits] Extracted body fields:', { userId, amount });

      if (!userId || !amount) {
        console.log('[PaymentController.finalizeCredits] Validation failed - Missing fields:', { userId, amount });
        res.status(400).json({ success: false, error: 'Missing userId or amount' });
        return;
      }

      console.log('[PaymentController.finalizeCredits] All required fields present');

      const creditsToAdd = Math.floor(amount / 5); // Rs. 5 per credit
      console.log('[PaymentController.finalizeCredits] Calculated credits to add:', creditsToAdd);

      const user = await AuthService.addCredits(userId, creditsToAdd);
      console.log('[PaymentController.finalizeCredits] User credits updated:', {
        userId,
        newCredits: user.message_credits,
      });

      await Payment.create({ user_id: userId, amount, credits_added: creditsToAdd, timestamp: new Date() });
      console.log('[PaymentController.finalizeCredits] Payment record created');

      io.to(userId).emit('creditsUpdated', { message_credits: user.message_credits });
      console.log('[PaymentController.finalizeCredits] Emitted creditsUpdated to user:', userId);

      res.json({ success: true, message: 'Credits added successfully', data: { credits: user.message_credits } });
    } catch (error) {
      console.error('[PaymentController.finalizeCredits] Error:', (error as Error).message);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new PaymentController();