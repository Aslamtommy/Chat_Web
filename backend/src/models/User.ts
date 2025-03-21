import mongoose, { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true,  },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

export default model<IUser>('User', userSchema);