"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatThread_1 = __importDefault(require("../models/ChatThread"));
class ChatRepository {
    async findByUserId(userId) {
        return ChatThread_1.default.findOne({ user_id: userId }).lean();
    }
    async create(userId) {
        const chat = new ChatThread_1.default({ user_id: userId, messages: [] });
        return chat.save();
    }
    async addMessage(userId, message) {
        const updatedChat = await ChatThread_1.default.findOneAndUpdate({ user_id: userId }, { $push: { messages: message } }, { new: true, upsert: true }).lean();
        console.log(`Added message for user ${userId}:`, message);
        return updatedChat;
    }
    async getAllThreads() {
        return ChatThread_1.default.find().populate('user_id', 'username role -_id').lean();
    }
    async findMessageByContent(userId, content) {
        const chat = await ChatThread_1.default.findOne({
            user_id: userId,
            'messages.content': content,
            'messages.timestamp': { $gte: new Date(Date.now() - 5000) },
        }).lean();
        return chat?.messages.find((m) => m.content === content) || null;
    }
    async markMessagesAsRead(userId, adminId) {
        console.trace(`markMessagesAsRead called for user ${userId} by admin ${adminId}`);
        await ChatThread_1.default.updateOne({ user_id: userId }, {
            $set: {
                last_read_by_admin: new Date(),
                'messages.$[].read_by_admin': true
            }
        });
        console.log(`Marked messages as read for user ${userId} by admin ${adminId}`);
    }
    async getUnreadCounts(adminId) {
        const threads = await ChatThread_1.default.find().populate('user_id', 'username').lean();
        const unreadCounts = {};
        for (const thread of threads) {
            if (!thread.user_id)
                continue;
            const userId = thread.user_id._id.toString();
            unreadCounts[userId] = thread.messages.filter(msg => (msg.read_by_admin === undefined || !msg.read_by_admin) && msg.sender_id.toString() !== adminId).length;
        }
        return unreadCounts;
    }
    async getUnreadCount(userId) {
        console.log(`getUnreadCount called for user ${userId}`);
        const thread = await ChatThread_1.default.findOne({ user_id: userId }).lean();
        if (!thread) {
            console.log(`No chat thread found for user ${userId}`);
            return 0;
        }
        const unreadMessages = thread.messages.filter(msg => msg.read_by_admin === undefined || !msg.read_by_admin);
        console.log(`Unread count for user ${userId}: ${unreadMessages.length}`, unreadMessages);
        return unreadMessages.length;
    }
}
exports.default = new ChatRepository();
