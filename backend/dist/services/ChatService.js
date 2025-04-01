"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/ChatService.ts
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
            sender_id: new mongoose_1.default.Types.ObjectId(senderId),
            message_type: messageType,
            content,
            timestamp: new Date(),
        };
        // Set read_by_admin only if the sender is the user (chatThreadId represents the user ID)
        if (senderId.toString() === chatThreadId) {
            message.read_by_admin = false; // User-sent message, unread by admin
        }
        else {
            message.read_by_admin = true; // Admin-sent message, inherently "read" by admin
        }
        return ChatRepository_1.default.addMessage(chatThreadId, message);
    }
    async getAllChats() {
        return ChatRepository_1.default.getAllThreads();
    }
}
exports.default = new ChatService();
