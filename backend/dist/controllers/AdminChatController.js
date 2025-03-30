"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
const StorageService_1 = __importDefault(require("../services/StorageService"));
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
const server_1 = require("../server");
class AdminChatController {
    async getAllChats(req, res) {
        try {
            const chats = await ChatService_1.default.getAllChats();
            res.json({ success: true, data: chats });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getUnreadCounts(req, res) {
        try {
            const adminId = req.user?.id;
            if (!adminId)
                throw new Error('Admin ID not found');
            const unreadCounts = await ChatRepository_1.default.getUnreadCounts(adminId);
            res.json({ success: true, data: unreadCounts });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getUserChatHistory(req, res) {
        try {
            const { userId } = req.params;
            const chat = await ChatRepository_1.default.findByUserId(userId);
            if (!chat) {
                res.json({ success: true, data: { messages: [] } });
                return;
            }
            res.json({ success: true, data: chat });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async markMessagesAsRead(req, res) {
        try {
            const { userId } = req.params;
            const adminId = req.user?.id;
            if (!adminId)
                throw new Error('Admin ID not found');
            await ChatRepository_1.default.markMessagesAsRead(userId, adminId);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async sendMessageToUserChat(req, res) {
        try {
            const userId = req.params.userId;
            const senderId = req.user.id;
            const { messageType } = req.body;
            let content;
            if (!messageType)
                throw new Error('messageType is required');
            if (!['text', 'image', 'voice'].includes(messageType))
                throw new Error('Invalid messageType');
            if (messageType === 'text') {
                content = req.body.content;
                if (!content)
                    throw new Error('content is required for text messages');
            }
            else {
                const file = req.file;
                if (!file)
                    throw new Error('File is required for image or voice messages');
                content = await StorageService_1.default.uploadFile(file, messageType === 'image' ? 'image' : 'audio');
            }
            const updatedChat = await ChatService_1.default.saveMessage(userId, senderId, messageType, content);
            // Emit real-time update via Socket.io
            const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
            if (!newMessage || !newMessage._id) {
                throw new Error('Message not saved properly');
            }
            const messagePayload = {
                _id: newMessage._id.toString(),
                chatId: updatedChat._id.toString(),
                senderId,
                content: newMessage.content,
                messageType: newMessage.message_type,
                timestamp: newMessage.timestamp,
                status: 'delivered',
                isAdmin: true,
                read: false,
            };
            server_1.io.to(userId).emit('newMessage', messagePayload);
            res.json({ success: true, data: updatedChat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new AdminChatController();
