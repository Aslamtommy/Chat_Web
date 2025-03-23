import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../types';

class AuthService {
  async register({
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
  }: {
    username: string;
    email: string;
    password: string;
    age: number;
    fathersName: string;
    mothersName: string;
    phoneNo: string;
    place: string;
    district: string;
    role?: 'user' | 'admin';
  }): Promise<IUser> {
    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
      username,
      email,
      password: hashedPassword,
      age,
      fathersName,
      mothersName,
      phoneNo,
      place,
      district,
      role: role || 'user',
    });
    return user;
  }

  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email not found');
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new Error('Incorrect password');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: '1h', // Add token expiration for security
    });
    return { token, user };
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserRepository.findById(id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as IUser;
  }
}

export default new AuthService();