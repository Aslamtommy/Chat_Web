"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
const mongoose_1 = __importDefault(require("mongoose"));
class AdminChatController {
    async getAllChats(req, res) {
        try {
            console.log('adminchatcontroll first');
            const chats = await ChatService_1.default.getAllChats();
            console.log('adminchatcontroll after');
            res.json({ success: true, data: chats });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getUserChatHistory(req, res) {
        try {
            const userId = req.params.userId;
            // Validate userId as a valid ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ success: false, error: 'Invalid user ID' });
                return;
            }
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
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ success: false, error: 'Invalid user ID' });
                return;
            }
            const senderId = req.user.id;
            const { messageType, content } = req.body;
            const updatedChat = await ChatService_1.default.saveMessage(userId, senderId, messageType, content);
            res.json({ success: true, data: updatedChat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new AdminChatController();
