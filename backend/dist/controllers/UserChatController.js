"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
const StorageService_1 = __importDefault(require("../services/StorageService"));
const server_1 = require("../server"); // Ensure io is exported from your server file (e.g., index.ts)
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
class UserChatController {
    async getMyChatHistory(req, res) {
        try {
            const userId = req.user.id;
            const chat = await ChatService_1.default.getOrCreateChat(userId);
            res.json({ success: true, data: chat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async sendMessageToMyChat(req, res) {
        try {
            const userId = req.user.id;
            const { messageType, duration } = req.body;
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
                content = await StorageService_1.default.uploadFile(file, messageType);
            }
            console.log(`[sendMessageToMyChat] Saving message for user: ${userId}, content: ${content}`);
            const updatedChat = await ChatService_1.default.saveMessage(userId, userId, messageType, content, duration);
            const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
            if (!newMessage || !newMessage._id) {
                throw new Error('Message not saved properly');
            }
            console.log(`[sendMessageToMyChat] Message saved, ID: ${newMessage._id}`);
            // Emit real-time update via Socket.IO
            const messagePayload = {
                _id: newMessage._id.toString(),
                chatId: updatedChat._id.toString(),
                senderId: userId,
                content: newMessage.content,
                messageType: newMessage.message_type,
                timestamp: newMessage.timestamp,
                status: 'delivered',
                isAdmin: false,
                read: false,
            };
            server_1.io.to('admin-room').emit('newMessage', messagePayload);
            console.log(`[sendMessageToMyChat] Emitted newMessage for user: ${userId}`);
            // Update unread counts
            const unreadCount = await ChatRepository_1.default.getUnreadCount(userId);
            server_1.io.to('admin-room').emit('updateUnreadCount', {
                userId,
                unreadCount,
            });
            console.log(`[sendMessageToMyChat] Emitted updateUnreadCount for user: ${userId}, count: ${unreadCount}`);
            // Emit updateUserOrder for real-time sorting
            server_1.io.to('admin-room').emit('updateUserOrder', {
                userId,
                timestamp: newMessage.timestamp,
            });
            console.log(`[sendMessageToMyChat] Emitted updateUserOrder for user: ${userId}, timestamp: ${newMessage.timestamp}`);
            res.json({ success: true, data: updatedChat });
        }
        catch (error) {
            console.error(`[sendMessageToMyChat] Error: ${error.message}`);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new UserChatController();
