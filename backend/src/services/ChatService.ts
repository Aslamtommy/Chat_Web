import ChatRepository from '../repositories/ChatRepository';
import { IChatThread, IMessage } from '../types';
import mongoose from 'mongoose';

class ChatService {
  async getOrCreateChat(userId: string): Promise<IChatThread> {
    let chat = await ChatRepository.findByUserId(userId);
    if (!chat) {
      chat = await ChatRepository.create(userId);
    }
    return chat;
  }

  async saveMessage(chatThreadId: string, senderId: any, messageType: 'text' | 'image' | 'voice', content: string): Promise<IChatThread> {
    const message: IMessage = {
      sender_id: new mongoose.Types.ObjectId(senderId), // Ensure ObjectId
      message_type: messageType,
      content,
      timestamp: new Date(),
      read_by_admin: false, // Explicitly set to false
    };
    return ChatRepository.addMessage(chatThreadId, message);
  }

  async getAllChats(): Promise<IChatThread[]> {
    return ChatRepository.getAllThreads();
  }
}

export default new ChatService();