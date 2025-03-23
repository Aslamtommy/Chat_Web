"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
class ChatService {
    async getOrCreateChat(userId) {
        let chat = await ChatRepository_1.default.findByUserId(userId);
        if (!chat) {
            chat = await ChatRepository_1.default.create(userId);
        }
        return chat;
    }
    async saveMessage(userId, senderId, messageType, content) {
        const message = { sender_id: senderId, message_type: messageType, content, timestamp: new Date() };
        return ChatRepository_1.default.addMessage(userId, message);
    }
    async getAllChats() {
        return ChatRepository_1.default.getAllThreads();
    }
}
exports.default = new ChatService();
