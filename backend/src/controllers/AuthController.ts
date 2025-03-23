import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import UserRepository from '../repositories/UserRepository';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        age,
        fathersName,
        mothersName,
        phoneNo,
        place,
        district,
        role,
      } = req.body;

      // Basic input validation
      if (!username || !email || !password) {
        res.status(400).json({ success: false, error: 'Username, email, and password are required' });
        return;
      }

      const user = await AuthService.register({
        username,
        email,
        password,
        age,
        fathersName,
        mothersName,
        phoneNo,
        place,
        district,
        role,
      });
      res.status(201).json({ success: true, data: { message: 'User created successfully', user } });
    } catch (error) {
      console.error('Register error:', (error as Error).message);
      const message = (error as Error).message;
      if (message === 'Email already exists') {
        res.status(400).json({ success: false, error: 'Email already exists' });
      } else if ((error as any).code === 11000) {
        const field = Object.keys((error as any).keyValue)[0];
        res.status(400).json({ success: false, error: `${field} already exists` });
      } else {
        res.status(500).json({ success: false, error: 'Registration failed' });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }
      const { token, user } = await AuthService.login(email, password);
      res.json({ success: true, data: { token, user } });
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Email not found') {
        res.status(404).json({ success: false, error: 'Email not found' });
      } else if (message === 'Incorrect password') {
        res.status(401).json({ success: false, error: 'Incorrect password' });
      } else {
        res.status(500).json({ success: false, error: 'Login failed' });
      }
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
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(401).json({ success: false, error: (error as Error).message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { age, fathersName, mothersName, phoneNo, place, district } = req.body;
      if (!req.user || !req.user.id) {
        throw new Error('User not authenticated');
      }
      if (!age || typeof age !== 'number') {
        throw new Error('Age must be a valid number');
      }
      console.log('Received payload:', req.body); // Debug log
      const updatedUser = await UserRepository.findById(req.user.id);
      if (!updatedUser) {
        throw new Error('User not found');
      }
      updatedUser.set({
        age,
        fathersName: fathersName || updatedUser.fathersName,
        mothersName: mothersName || updatedUser.mothersName,
        phoneNo: phoneNo || updatedUser.phoneNo,
        place: place || updatedUser.place,
        district: district || updatedUser.district,
      });
      await updatedUser.save();
      const { password, ...userWithoutPassword } = updatedUser.toObject();
      res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
      console.error('Update profile error:', (error as Error).message);
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new AuthController();