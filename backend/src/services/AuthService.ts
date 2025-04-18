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
    message_credits = 20,
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
    message_credits?: number; // Optional
  }): Promise<IUser> {
    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNo)) {
      throw new Error('Phone number must be 10 digits');
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
      message_credits,
    });
    return user;
  }

  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'mysecret', {
      expiresIn: '1h',
    });

    return { token, user };
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    profileData: {
      age?: number;
      fathersName?: string;
      mothersName?: string;
      phoneNo?: string;
      place?: string;
      district?: string;
    }
  ): Promise<IUser> {
    // Convert age to number if it exists and is a string
    if (profileData.age) {
      const ageAsNumber = Number(profileData.age);
      
      // Validate the number
      if (isNaN(ageAsNumber) || ageAsNumber <= 0) {
        throw new Error('Age must be a valid number');
      }
      
      // Assign the converted value
      profileData.age = ageAsNumber;
    }

    // Fetch the existing user
    const existingUser = await UserRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updateData: Partial<IUser> = {
      age: profileData.age,
      fathersName: profileData.fathersName || existingUser.fathersName,
      mothersName: profileData.mothersName || existingUser.mothersName,
      phoneNo: profileData.phoneNo || existingUser.phoneNo,
      place: profileData.place || existingUser.place,
      district: profileData.district || existingUser.district,
    };

    const updatedUser = await UserRepository.updateById(userId, updateData);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    // Return the updated user directly since it's already a plain object
    return updatedUser as IUser;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserRepository.findByEmail(email);
    console.log('findByEmail result for', email, ':', user); // Debug log
    return user;
  }

  async addCredits(userId: string, credits: number): Promise<IUser> {
    // Explicitly define the update object to include message_credits
    const updateData: { message_credits: number } = { message_credits: credits };
    const user = await UserRepository.updateById(userId, { $inc: updateData });
    if (!user) throw new Error('User not found');
    return user;
  }
}

export default new AuthService();