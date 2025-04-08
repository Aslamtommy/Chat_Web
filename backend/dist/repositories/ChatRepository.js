"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatThread_1 = __importDefault(require("../models/ChatThread"));
const mongoose_1 = __importDefault(require("mongoose"));
// Cache for unread counts with 5-minute expiration
const unreadCountsCache = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes
class ChatRepository {
    async findByUserId(userId) {
        return ChatThread_1.default.findOne({ user_id: userId })
            .select('messages last_read_by_admin')
            .lean();
    }
    async create(userId) {
        const chat = new ChatThread_1.default({ user_id: userId, messages: [] });
        return chat.save();
    }
    async addMessage(userId, message) {
        console.log(`[addMessage] Adding message for user: ${userId}, content: ${message.content}, timestamp: ${new Date().toISOString()}`);
        const updatedChat = await ChatThread_1.default.findOneAndUpdate({ user_id: userId }, {
            $push: { messages: message },
            $set: { last_read_by_admin: null }
        }, { new: true, upsert: true }).lean();
        console.log(`[addMessage] Message added for user: ${userId}, message ID: ${updatedChat.messages[updatedChat.messages.length - 1]._id}`);
        unreadCountsCache.delete(userId);
        return updatedChat;
    }
    async getAllThreads() {
        return ChatThread_1.default.find()
            .populate('user_id', 'username role -_id')
            .select('messages last_read_by_admin')
            .lean();
    }
    async findMessageByContent(userId, content) {
        const chat = await ChatThread_1.default.findOne({
            user_id: userId,
            'messages.content': content,
            'messages.timestamp': { $gte: new Date(Date.now() - 5000) }
        })
            .select('messages.$')
            .lean();
        return chat?.messages[0] || null;
    }
    async markMessagesAsRead(userId, adminId) {
        await ChatThread_1.default.updateOne({ user_id: userId }, {
            $set: {
                'messages.$[elem].read_by_admin': true
            }
        }, {
            arrayFilters: [{ 'elem.sender_id': new mongoose_1.default.Types.ObjectId(userId), 'elem.read_by_admin': false }]
        });
        // Update cache
        const cacheKey = `${userId}-${adminId}`;
        unreadCountsCache.set(cacheKey, { count: 0, timestamp: Date.now() });
    }
    async getUnreadCounts(adminId) {
        const threads = await ChatThread_1.default.find()
            .populate('user_id', 'username')
            .select('user_id messages')
            .lean();
        const unreadCounts = {};
        for (const thread of threads) {
            if (!thread.user_id)
                continue;
            const userId = thread.user_id._id.toString();
            const cacheKey = `${userId}-${adminId}`;
            const cached = unreadCountsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
                unreadCounts[userId] = cached.count;
                continue;
            }
            const count = thread.messages.filter(msg => (msg.read_by_admin === undefined || !msg.read_by_admin) &&
                msg.sender_id.toString() !== adminId).length;
            unreadCounts[userId] = count;
            unreadCountsCache.set(cacheKey, { count, timestamp: Date.now() });
        }
        return unreadCounts;
    }
    async getUnreadCount(userId) {
        console.log(`[getUnreadCount] Called for user: ${userId}, timestamp: ${new Date().toISOString()}`);
        const thread = await ChatThread_1.default.findOne({ user_id: userId })
            .select('messages')
            .lean();
        if (!thread) {
            console.log(`[getUnreadCount] No thread found for user: ${userId}`);
            return 0;
        }
        const count = thread.messages.filter(msg => msg.sender_id.toString() === userId && msg.read_by_admin === false).length;
        console.log(`[getUnreadCount] Unread count for user ${userId}: ${count}, messages: ${thread.messages.length}`);
        return count;
    }
    async updateMessage(messageId, content) {
        const chat = await ChatThread_1.default.findOneAndUpdate({ 'messages._id': messageId }, {
            $set: {
                'messages.$.content': content,
                'messages.$.isEdited': true,
            },
        }, { new: true }).lean();
        const updatedMessage = chat?.messages.find((msg) => msg._id.toString() === messageId);
        if (!updatedMessage)
            throw new Error('Message not found');
        return updatedMessage;
    }
    async deleteMessage(messageId) {
        const result = await ChatThread_1.default.updateOne({ 'messages._id': messageId }, {
            $set: {
                'messages.$.isDeleted': true,
            },
        });
        if (result.modifiedCount === 0)
            throw new Error('Message not found or already deleted');
    }
}
exports.default = new ChatRepository();
