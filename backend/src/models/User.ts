// models/User.ts
import mongoose, { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Added unique constraint
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  age: { type: Number, required: true },
  fathersName: { type: String, required: true },
  mothersName: { type: String, required: true },
  phoneNo: { type: String, required: true },
  place: { type: String, required: true },
  district: { type: String, required: true },
});

export default model<IUser>('User', userSchema);