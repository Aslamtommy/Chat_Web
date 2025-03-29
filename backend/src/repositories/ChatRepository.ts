// repositories/ChatRepository.ts
import ChatThread from '../models/ChatThread';
import { IChatThread, IMessage } from '../types';

class ChatRepository {
  async findByUserId(userId: string): Promise<IChatThread | null> {
    return ChatThread.findOne({ user_id: userId }).lean();
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
    ).lean() as Promise<IChatThread>;
  }

  async getAllThreads(): Promise<IChatThread[]> {
    return ChatThread.find().populate('user_id', '-password').lean();
  }
  async findMessageByContent(chatId: string, content: string): Promise<IMessage | null> {
    const chat = await ChatThread.findOne({
      _id: chatId,
      'messages.content': content,
      'messages.timestamp': { $gte: new Date(Date.now() - 5000) } // Check last 5 seconds
    });
    return chat?.messages.find(m => m.content === content) || null;
  }
}

export default new ChatRepository();