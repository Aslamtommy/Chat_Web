// repositories/UserRepository.ts
import User from '../models/User';
import { IUser } from '../types';

class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).lean();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).select('-password').lean();
  }

  async findAll(): Promise<IUser[]> {
    return User.find({ role: { $ne: 'admin' } })  // Exclude admin users
      .select('-password')
      .lean();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }
  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const user = await User.findById(id);
    if (!user) return null;
    user.set(updateData);
    return user.save();
  }
}

export default new UserRepository();