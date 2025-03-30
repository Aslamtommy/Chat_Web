"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
const mongoose_1 = __importDefault(require("mongoose"));
class ChatService {
    async getOrCreateChat(userId) {
        let chat = await ChatRepository_1.default.findByUserId(userId);
        if (!chat) {
            chat = await ChatRepository_1.default.create(userId);
        }
        return chat;
    }
    async saveMessage(chatThreadId, senderId, messageType, content) {
        const message = {
            sender_id: new mongoose_1.default.Types.ObjectId(senderId), // Ensure ObjectId
            message_type: messageType,
            content,
            timestamp: new Date(),
            read_by_admin: false, // Explicitly set to false
        };
        return ChatRepository_1.default.addMessage(chatThreadId, message);
    }
    async getAllChats() {
        return ChatRepository_1.default.getAllThreads();
    }
}
exports.default = new ChatService();
