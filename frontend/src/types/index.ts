import { Types } from 'mongoose';

 
export interface IMessage {
  _id?: Types.ObjectId;
  sender_id: Types.ObjectId;
  message_type: 'text' | 'image';
  content: string;
  timestamp: Date;
}

export interface IChatThread {
  _id: Types.ObjectId;
  user_id: Types.ObjectId | any; // Union type: raw ObjectId or populated user object
  messages: IMessage[];
}