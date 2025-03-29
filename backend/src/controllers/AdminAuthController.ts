// controllers/AdminAuthController.ts
import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import UserRepository from '../repositories/UserRepository';

class AdminAuthController {
  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new Error('Email and password are required');
      const { token, user } = await AuthService.login(email, password);
      if (user.role !== 'admin') throw new Error('Only admins can use this endpoint');
      res.json({ success: true, data: { token, user } });
    } catch (error) {
      res.status(401).json({ success: false, error: (error as Error).message });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserRepository.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserRepository.findById(req.params.id);

    
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