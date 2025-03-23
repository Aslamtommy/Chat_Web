"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = __importDefault(require("../services/AuthService"));
const User_1 = __importDefault(require("../models/User"));
class AdminAuthController {
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            const { token, user } = await AuthService_1.default.login(email, password);
            if (user.role !== 'admin') {
                throw new Error('Only admins can use this endpoint');
            }
            res.json({ success: true, data: { token, user } });
        }
        catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }
    async getUsers(req, res) {
        try {
            const users = await User_1.default.find().select('-password');
            res.json({ success: true, data: users });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getUserById(req, res) {
        try {
            const user = await User_1.default.findById(req.params.id).select('-password');
            console.log(user);
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
