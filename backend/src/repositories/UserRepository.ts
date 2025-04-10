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
  async updateById(id: string, updateData: any): Promise<IUser | null> {
    // Use findOneAndUpdate for atomic updates, returning the updated document
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true, lean: true } // Return the updated document
    );
    if (!updatedUser) return null;
    // Remove password from the returned object
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as any
  }
  async deleteById(id: string): Promise<void> {
    const result = await User.findByIdAndDelete(id);
    if (!result) throw new Error('User not found');
  }
}

export default new UserRepository();