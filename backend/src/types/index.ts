import { Types,Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface IMessage {
  sender_id: Types.ObjectId;
  message_type: 'text' | 'image';
  content: string;
  timestamp: Date;
}

export interface IChatThread {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  messages: IMessage[];
}