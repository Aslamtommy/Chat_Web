// repositories/ChatRepository.ts
import ChatThread from '../models/ChatThread';
import { IChatThread, IMessage } from '../types';

class ChatRepository {
  async findByUserId(userId: string): Promise<IChatThread | null> {
    return ChatThread.findOne({ user_id: userId });
  }

  async create(userId: string): Promise<IChatThread> {
    const chat = new ChatThread({ user_id: userId, messages: [] });
    return chat.save();
  }

  async addMessage(userId: string, message: IMessage): Promise<IChatThread> {
    return ChatThread.findOneAndUpdate(
      { user_id: userId },
      { $push: { messages: message } },
      { new: true, upsert: true }
    ) as Promise<IChatThread>;
  }

  async getAllThreads(): Promise<IChatThread[]> {
    return ChatThread.find().populate('user_id', '-password'); // Populate all fields except password
  }
}

export default new ChatRepository();