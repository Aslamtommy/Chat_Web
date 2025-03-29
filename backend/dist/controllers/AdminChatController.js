"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
const StorageService_1 = __importDefault(require("../services/StorageService"));
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
    async getUserChatHistory(req, res) {
        try {
            const userId = req.params.userId;
            const chat = await ChatService_1.default.getOrCreateChat(userId);
            res.json({ success: true, data: chat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
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
            res.json({ success: true, data: updatedChat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new AdminChatController();
