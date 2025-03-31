import ChatThread from '../models/ChatThread';
import { IChatThread, IMessage } from '../types';
import mongoose from 'mongoose';

// Cache for unread counts with 5-minute expiration
const unreadCountsCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

class ChatRepository {
  async findByUserId(userId: string): Promise<IChatThread | null> {
    return ChatThread.findOne({ user_id: userId })
      .select('messages last_read_by_admin')
      .lean<IChatThread>();
  }

  async create(userId: string): Promise<IChatThread> {
    const chat = new ChatThread({ user_id: userId, messages: [] });
    return chat.save();
  }

  async addMessage(userId: string, message: IMessage): Promise<IChatThread> {
    const updatedChat = await ChatThread.findOneAndUpdate(
      { user_id: userId },
      { 
        $push: { messages: message },
        $set: { last_read_by_admin: null } // Reset last_read_by_admin when new message arrives
      },
      { new: true, upsert: true }
    ).lean<IChatThread>();

    // Invalidate cache for this user
    unreadCountsCache.delete(userId);
    return updatedChat;
  }

  async getAllThreads(): Promise<IChatThread[]> {
    return ChatThread.find()
      .populate('user_id', 'username role -_id')
      .select('messages last_read_by_admin')
      .lean<IChatThread[]>();
  }

  async findMessageByContent(userId: string, content: string): Promise<IMessage | null> {
    const chat = await ChatThread.findOne({
      user_id: userId,
      'messages.content': content,
      'messages.timestamp': { $gte: new Date(Date.now() - 5000) }
    })
    .select('messages.$')
    .lean<IChatThread>();
    
    return chat?.messages[0] || null;
  }

  async markMessagesAsRead(userId: string, adminId: string): Promise<void> {
    await ChatThread.updateOne(
      { user_id: userId },
      { 
        $set: { 
          'messages.$[elem].read_by_admin': true 
        } 
      },
      {
        arrayFilters: [{ 'elem.sender_id': new mongoose.Types.ObjectId(userId), 'elem.read_by_admin': false }]
      }
    );
    
    // Update cache
    const cacheKey = `${userId}-${adminId}`;
    unreadCountsCache.set(cacheKey, { count: 0, timestamp: Date.now() });
  }
  async getUnreadCounts(adminId: string): Promise<{ [userId: string]: number }> {
    const threads = await ChatThread.find()
      .populate('user_id', 'username')
      .select('user_id messages')
      .lean<IChatThread[]>();
    
    const unreadCounts: { [userId: string]: number } = {};
    
    for (const thread of threads) {
      if (!thread.user_id) continue;
      const userId = thread.user_id._id.toString();
      const cacheKey = `${userId}-${adminId}`;
      const cached = unreadCountsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
        unreadCounts[userId] = cached.count;
        continue;
      }

      const count = thread.messages.filter(
        msg => (msg.read_by_admin === undefined || !msg.read_by_admin) && 
               msg.sender_id.toString() !== adminId
      ).length;

      unreadCounts[userId] = count;
      unreadCountsCache.set(cacheKey, { count, timestamp: Date.now() });
    }
    
    return unreadCounts;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const thread = await ChatThread.findOne({ user_id: userId })
      .select('messages')
      .lean<IChatThread>();
      
    if (!thread) return 0;
    
    // Count only messages from the user (sender_id matches userId) where read_by_admin is false
    return thread.messages.filter(
      msg => msg.sender_id.toString() === userId && msg.read_by_admin === false
    ).length;
  }
}

export default new ChatRepository();