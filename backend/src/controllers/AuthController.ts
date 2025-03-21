import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({ message: 'User created', user });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('hi');
      const { token, user } = await AuthService.login(req.body.email, req.body.password);
      res.json({ token, user });
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        throw new Error('User not found');
      }
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  }
}

export default new AuthController();