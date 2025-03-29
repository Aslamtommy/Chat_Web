"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// repositories/ChatRepository.ts
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
        return ChatThread_1.default.findOneAndUpdate({ user_id: userId }, { $push: { messages: message } }, { new: true, upsert: true }).lean();
    }
    async getAllThreads() {
        return ChatThread_1.default.find().populate('user_id', '-password').lean();
    }
    async findMessageByContent(chatId, content) {
        const chat = await ChatThread_1.default.findOne({
            _id: chatId,
            'messages.content': content,
            'messages.timestamp': { $gte: new Date(Date.now() - 5000) } // Check last 5 seconds
        });
        return chat?.messages.find(m => m.content === content) || null;
    }
}
exports.default = new ChatRepository();
