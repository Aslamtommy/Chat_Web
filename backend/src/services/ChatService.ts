// services/ChatService.ts
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
      sender_id: new mongoose.Types.ObjectId(senderId),
      message_type: messageType,
      content,
      timestamp: new Date(),
    };

    // Set read_by_admin only if the sender is the user (chatThreadId represents the user ID)
    if (senderId.toString() === chatThreadId) {
      message.read_by_admin = false; // User-sent message, unread by admin
    } else {
      message.read_by_admin = true; // Admin-sent message, inherently "read" by admin
    }

    return ChatRepository.addMessage(chatThreadId, message);
  }

  async getAllChats(): Promise<IChatThread[]> {
    return ChatRepository.getAllThreads();
  }
}

export default new ChatService();