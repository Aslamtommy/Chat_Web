"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
class ChatController {
    getChatHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chat = yield ChatService_1.default.getOrCreateChat(req.params.userId);
                res.json(chat);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    getAllChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
                    res.status(403).json({ error: 'Admins only' });
                    return;
                }
                const chats = yield ChatService_1.default.getAllChats();
                res.json(chats);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, messageType, content } = req.body;
                const senderId = req.user.id; // Set by authMiddleware
                // Restrict regular users to their own chat thread
                if (req.user.role !== 'admin' && userId !== req.user.id) {
                    throw new Error('You can only send messages to your own chat thread');
                }
                const updatedChat = yield ChatService_1.default.saveMessage(userId, senderId, messageType, content);
                res.json(updatedChat);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.default = new ChatController();
