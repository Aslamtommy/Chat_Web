import ChatRepository from '../repositories/ChatRepository';
import { IChatThread, IMessage } from '../types';

class ChatService {
  async getOrCreateChat(userId: string): Promise<IChatThread> {
    let chat = await ChatRepository.findByUserId(userId);
    if (!chat) {
      chat = await ChatRepository.create(userId);
    }
    return chat;
  }

  async saveMessage(userId: string, senderId: any, messageType: 'text' | 'image' | 'voice', content: string): Promise<IChatThread> {
    const message: IMessage = { sender_id: senderId, message_type: messageType, content, timestamp: new Date() };
    return ChatRepository.addMessage(userId, message);
  }

  async getAllChats(): Promise<IChatThread[]> {
    return ChatRepository.getAllThreads();
  }
}

export default new ChatService();