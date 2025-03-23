"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatService_1 = __importDefault(require("../services/ChatService"));
const StorageService_1 = __importDefault(require("../services/StorageService"));
exports.default = (io) => {
    io.on('connection', (socket) => {
        socket.on('joinChat', (userId) => {
            socket.join(`chat_${userId}`);
        });
        socket.on('sendMessage', async ({ userId, senderId, message, messageType }) => {
            let content = message;
            if (messageType === 'image') {
                content = await StorageService_1.default.uploadImage(message);
            }
            const updatedChat = await ChatService_1.default.saveMessage(userId, senderId, messageType, content);
            io.to(`chat_${userId}`).emit('receiveMessage', updatedChat.messages.slice(-1)[0]);
        });
    });
};
