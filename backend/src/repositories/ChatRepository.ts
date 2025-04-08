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
    console.log(`[addMessage] Adding message for user: ${userId}, content: ${message.content}, timestamp: ${new Date().toISOString()}`);
    const updatedChat = await ChatThread.findOneAndUpdate(
        { user_id: userId },
        { 
            $push: { messages: message },
            $set: { last_read_by_admin: null }
        },
        { new: true, upsert: true }
    ).lean<IChatThread>();
    console.log(`[addMessage] Message added for user: ${userId}, message ID: ${updatedChat.messages[updatedChat.messages.length - 1]._id}`);
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
    console.log(`[getUnreadCount] Called for user: ${userId}, timestamp: ${new Date().toISOString()}`);
    const thread = await ChatThread.findOne({ user_id: userId })
        .select('messages')
        .lean<IChatThread>();
    if (!thread) {
        console.log(`[getUnreadCount] No thread found for user: ${userId}`);
        return 0;
    }
    const count = thread.messages.filter(
        msg => msg.sender_id.toString() === userId && msg.read_by_admin === false
    ).length;
    console.log(`[getUnreadCount] Unread count for user ${userId}: ${count}, messages: ${thread.messages.length}`);
    return count;
}
  async updateMessage(messageId: string, content: string): Promise<IMessage> {
    const chat = await ChatThread.findOneAndUpdate(
      { 'messages._id': messageId },
      {
        $set: {
          'messages.$.content': content,
          'messages.$.isEdited': true,
        },
      },
      { new: true }
    ).lean<IChatThread>();
    const updatedMessage = chat?.messages.find((msg) => msg._id.toString() === messageId);
    if (!updatedMessage) throw new Error('Message not found');
    return updatedMessage;
  }
  
  async deleteMessage(messageId: string): Promise<void> {
    const result = await ChatThread.updateOne(
      { 'messages._id': messageId },
      {
        $set: {
          'messages.$.isDeleted': true,
        },
      }
    );
    if (result.modifiedCount === 0) throw new Error('Message not found or already deleted');
  }

  async deleteByUserId(userId: string): Promise<void> {
    const result = await ChatThread.deleteOne({ user_id: userId });
    if (result.deletedCount === 0) {
      console.warn(`No chat thread found for user ${userId} to delete`);
    }
    unreadCountsCache.delete(userId); // Clear cache
  }
}

export default new ChatRepository();