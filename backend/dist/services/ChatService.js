"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/ChatService.ts
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
const mongoose_1 = __importDefault(require("mongoose"));
const ChatThread_1 = __importDefault(require("../models/ChatThread"));
const cloudinary_1 = require("cloudinary");
class ChatService {
    async getOrCreateChat(userId) {
        let chat = await ChatRepository_1.default.findByUserId(userId);
        if (!chat) {
            chat = await ChatRepository_1.default.create(userId);
        }
        return chat;
    }
    async saveMessage(chatThreadId, senderId, messageType, content, duration) {
        const message = {
            sender_id: new mongoose_1.default.Types.ObjectId(senderId),
            message_type: messageType,
            content,
            duration,
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
    async editMessage(messageId, content) {
        return ChatRepository_1.default.updateMessage(messageId, content);
    }
    async deleteMessage(messageId) {
        // Retrieve the message to check its type and content
        const chat = await ChatThread_1.default.findOne({ 'messages._id': messageId });
        if (!chat)
            throw new Error('Message not found');
        const message = chat.messages.find((msg) => msg._id?.toString() === messageId);
        if (!message)
            throw new Error('Message not found');
        // Check if the message is an image or voice record
        if (message.message_type === 'image' || message.message_type === 'voice') {
            try {
                const publicId = getPublicIdFromUrl(message.content);
                const resourceType = message.message_type === 'image' ? 'image' : 'video';
                await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
                console.log(`Deleted ${message.message_type} from Cloudinary: ${publicId}`);
            }
            catch (error) {
                console.error(`Failed to delete media from Cloudinary: ${error}`);
                // Log the error but proceed with database deletion
            }
        }
        // Mark the message as deleted in the database
        await ChatRepository_1.default.deleteMessage(messageId);
    }
}
function getPublicIdFromUrl(url) {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1)
        throw new Error('Invalid Cloudinary URL');
    let startIndex = uploadIndex + 1;
    // Skip version number if present (e.g., v1234567890)
    if (parts[startIndex].startsWith('v') && !isNaN(Number(parts[startIndex].slice(1)))) {
        startIndex++;
    }
    const publicIdWithExtension = parts.slice(startIndex).join('/');
    // Remove file extension
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
    return publicId;
}
exports.default = new ChatService();
