import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../types';

class AuthService {
  async register({ username, email, password }: { username: string; email: string; password: string }): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({ username, email, password: hashedPassword });
    return user;
  }

  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    const user = await UserRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string);
    return { token, user };
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserRepository.findById(id);
    if (!user) return null;
    // Exclude password from response
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as IUser;
  }
}

export default new AuthService();