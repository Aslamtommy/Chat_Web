"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// repositories/ChatRepository.ts
const ChatThread_1 = __importDefault(require("../models/ChatThread"));
class ChatRepository {
    async findByUserId(userId) {
        return ChatThread_1.default.findOne({ user_id: userId });
    }
    async create(userId) {
        const chat = new ChatThread_1.default({ user_id: userId, messages: [] });
        return chat.save();
    }
    async addMessage(userId, message) {
        return ChatThread_1.default.findOneAndUpdate({ user_id: userId }, { $push: { messages: message } }, { new: true, upsert: true });
    }
    async getAllThreads() {
        return ChatThread_1.default.find().populate('user_id', '-password'); // Populate all fields except password
    }
}
exports.default = new ChatRepository();
