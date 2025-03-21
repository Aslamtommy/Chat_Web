export interface IUser {
    _id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
  }
  
  export interface IMessage {
    sender_id: string;
    message_type: 'text' | 'image';
    content: string;
    timestamp: string;
  }
  
  export interface IChatThread {
    _id: string;
    user_id: string;
    messages: IMessage[];
  }