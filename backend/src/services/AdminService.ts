// services/AdminService.ts (optional)
import UserRepository from '../repositories/UserRepository';
import ChatService from './ChatService';
import { IUser, IChatThread } from '../types';

class AdminService {
  async getAllUsers(): Promise<IUser[]> {
    return UserRepository.findAll(); // Add this method to UserRepository if needed
  }

  async getAllChats(): Promise<IChatThread[]> {
    return ChatService.getAllChats();
  }
}

export default new AdminService();