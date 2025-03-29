import ChatThread from '../models/ChatThread';
import { IChatThread, IMessage } from '../types';
import mongoose from 'mongoose';

class ChatRepository {
  async findByUserId(userId: string): Promise<IChatThread | null> {
    return ChatThread.findOne({ user_id: userId }).lean<IChatThread>();
  }

  async create(userId: string): Promise<IChatThread> {
    const chat = new ChatThread({ user_id: userId, messages: [] });
    return chat.save();
  }

  async addMessage(userId: string, message: IMessage): Promise<IChatThread> {
    const updatedChat = await ChatThread.findOneAndUpdate(
      { user_id: userId },
      { $push: { messages: message } },
      { new: true, upsert: true }
    ).lean<IChatThread>();
    console.log(`Added message for user ${userId}:`, message);
    return updatedChat;
  }

  async getAllThreads(): Promise<IChatThread[]> {
    return ChatThread.find().populate('user_id', 'username role -_id').lean<IChatThread[]>();
  }

  async findMessageByContent(userId: string, content: string): Promise<IMessage | null> {
    const chat = await ChatThread.findOne({
      user_id: userId,
      'messages.content': content,
      'messages.timestamp': { $gte: new Date(Date.now() - 5000) },
    }).lean<IChatThread>();
    return chat?.messages.find((m) => m.content === content) || null;
  }

  async markMessagesAsRead(userId: string, adminId: string): Promise<void> {
    console.trace(`markMessagesAsRead called for user ${userId} by admin ${adminId}`);
    await ChatThread.updateOne(
      { user_id: userId },
      { 
        $set: { 
          last_read_by_admin: new Date(),
          'messages.$[].read_by_admin': true 
        } 
      }
    );
    console.log(`Marked messages as read for user ${userId} by admin ${adminId}`);
  }

  async getUnreadCounts(adminId: string): Promise<{ [userId: string]: number }> {
    const threads = await ChatThread.find().populate('user_id', 'username').lean<IChatThread[]>();
    const unreadCounts: { [userId: string]: number } = {};
    
    for (const thread of threads) {
      if (!thread.user_id) continue;
      const userId = thread.user_id._id.toString();
      unreadCounts[userId] = thread.messages.filter(
        msg => (msg.read_by_admin === undefined || !msg.read_by_admin) && msg.sender_id.toString() !== adminId
      ).length;
    }
    return unreadCounts;
  }

  async getUnreadCount(userId: string): Promise<number> {
    console.log(`getUnreadCount called for user ${userId}`);
    const thread = await ChatThread.findOne({ user_id: userId }).lean<IChatThread>();
    if (!thread) {
      console.log(`No chat thread found for user ${userId}`);
      return 0;
    }
    
    const unreadMessages = thread.messages.filter(
      msg => msg.read_by_admin === undefined || !msg.read_by_admin
    );
    console.log(`Unread count for user ${userId}: ${unreadMessages.length}`, unreadMessages);
    return unreadMessages.length;
  }
}

export default new ChatRepository();