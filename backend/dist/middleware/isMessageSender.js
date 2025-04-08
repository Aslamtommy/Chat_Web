"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatThread_1 = __importDefault(require("../models/ChatThread"));
const isMessageSender = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        // Fetch the chat thread containing the message
        const chat = await ChatThread_1.default.findOne({ 'messages._id': messageId }).lean();
        if (!chat) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }
        // Find the message in the messages array
        const message = chat.messages.find((msg) => msg._id?.toString() === messageId);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }
        // Check if the sender_id matches the userId
        if (message.sender_id.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'You can only edit or delete your own messages' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.default = isMessageSender;
