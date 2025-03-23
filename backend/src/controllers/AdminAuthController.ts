// controllers/AdminAuthController.ts
import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import User from '../models/User';

class AdminAuthController {
  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { token, user } = await AuthService.login(email, password);
      if (user.role !== 'admin') {
        throw new Error('Only admins can use this endpoint');
      }
      res.json({ success: true, data: { token, user } });
    } catch (error) {
      res.status(401).json({ success: false, error: (error as Error).message });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-password');
   
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id).select('-password');
      console.log(user )
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new AdminAuthController();