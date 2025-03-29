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
    const token = jwt.sign({ id: user._id, role: user.role },  'mysecret', {
      expiresIn: '1h', // Add token expiration for security
    });

  
    return { token, user };
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await UserRepository.findById(id);
    if (!user) return null;
  
    return user
  }
 // In AuthService.ts
async updateProfile(
  userId: string,
  profileData: {
    age?: number ;  // Accept both number and string temporarily
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

  const { password, ...userWithoutPassword } = updatedUser.toObject();
  return userWithoutPassword as IUser;
}

}

export default new AuthService();