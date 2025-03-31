// controllers/AdminAuthController.ts
import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import UserRepository from '../repositories/UserRepository';
import ChatRepository from '../repositories/ChatRepository';
import { IUser } from '../types';
import mongoose from 'mongoose';

interface UserWithId extends IUser {
  _id: mongoose.Types.ObjectId;
}

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

  async getUsersWithLastMessage(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserRepository.findAll() as UserWithId[];
      const usersWithLastMessage = await Promise.all(
        users.map(async (user) => {
          const chat = await ChatRepository.findByUserId(user._id.toString());
          const lastMessage = chat?.messages[chat.messages.length - 1];
          return {
            ...user,
            lastMessageTimestamp: lastMessage?.timestamp || null,
          };
        })
      );

      // Sort users by last message timestamp
      const sortedUsers = usersWithLastMessage.sort((a, b) => {
        if (!a.lastMessageTimestamp) return 1;
        if (!b.lastMessageTimestamp) return -1;
        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
      });

      res.json({ success: true, data: sortedUsers });
    } catch (error) {
      console.error('Error in getUsersWithLastMessage:', error);
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