import { Types, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  age: number;
  fathersName: string;
  mothersName: string;
  phoneNo: string;
  place: string;
  district: string;
  message_credits?:number
}

export interface IMessage {
  _id?: any
  sender_id: string | any;
  message_type: 'text' | 'image' | 'voice';
  content: string;
  timestamp?: Date;
  read_by_admin?: boolean; // Changed to required with default false in schema
  isEdited?:boolean,
  isDeleted?:boolean,
  duration?:any
}

export interface IChatThread extends Document {
  _id: Types.ObjectId;
  user_id: string | any;
  messages: IMessage[];
  last_read_by_admin?: Date;
 
}

export interface IPaymentRequest {
  _id: string;
  userId:any
  adminId: any
  paymentDetails: {
    accountNumber: string;
    ifscCode: string;
    amount: string;
    name: string;
    upiId: string;
  };
  status: 'pending' | 'uploaded';
  screenshotUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}