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
        const updatedChat = await ChatThread_1.default.findOneAndUpdate({ user_id: userId }, {
            $push: { messages: message },
            $set: { last_read_by_admin: null } // Reset last_read_by_admin when new message arrives
        }, { new: true, upsert: true }).lean();
        // Invalidate cache for this user
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
        const thread = await ChatThread_1.default.findOne({ user_id: userId })
            .select('messages')
            .lean();
        if (!thread)
            return 0;
        // Count only messages from the user (sender_id matches userId) where read_by_admin is false
        return thread.messages.filter(msg => msg.sender_id.toString() === userId && msg.read_by_admin === false).length;
    }
}
exports.default = new ChatRepository();
