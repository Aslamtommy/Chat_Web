"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = __importDefault(require("../services/AuthService"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
class AdminAuthController {
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                throw new Error('Email and password are required');
            const { token, user } = await AuthService_1.default.login(email, password);
            if (user.role !== 'admin')
                throw new Error('Only admins can use this endpoint');
            res.json({ success: true, data: { token, user } });
        }
        catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }
    async getUsers(req, res) {
        try {
            const users = await UserRepository_1.default.findAll();
            res.json({ success: true, data: users });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getUsersWithLastMessage(req, res) {
        try {
            const users = await UserRepository_1.default.findAll();
            const usersWithLastMessage = await Promise.all(users.map(async (user) => {
                const chat = await ChatRepository_1.default.findByUserId(user._id.toString());
                const lastMessage = chat?.messages[chat.messages.length - 1];
                return {
                    ...user,
                    lastMessageTimestamp: lastMessage?.timestamp || null,
                };
            }));
            // Sort users by last message timestamp
            const sortedUsers = usersWithLastMessage.sort((a, b) => {
                if (!a.lastMessageTimestamp)
                    return 1;
                if (!b.lastMessageTimestamp)
                    return -1;
                return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
            });
            res.json({ success: true, data: sortedUsers });
        }
        catch (error) {
            console.error('Error in getUsersWithLastMessage:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getUserById(req, res) {
        try {
            const user = await UserRepository_1.default.findById(req.params.id);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.default = new AdminAuthController();
