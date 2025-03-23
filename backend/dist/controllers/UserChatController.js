"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
class UserChatController {
    // Get the authenticated user's chat history
    async getMyChatHistory(req, res) {
        try {
            const userId = req.user.id; // Authenticated user's ID
            const chat = await ChatService_1.default.getOrCreateChat(userId);
            res.json({ success: true, data: chat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    // Send a message to the authenticated user's own chat thread
    async sendMessageToMyChat(req, res) {
        try {
            const userId = req.user.id; // Authenticated user's ID as both sender and chat owner
            const { messageType, content } = req.body;
            const updatedChat = await ChatService_1.default.saveMessage(userId, userId, messageType, content);
            res.json({ success: true, data: updatedChat });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new UserChatController();
