"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = __importDefault(require("../services/AuthService"));
class AuthController {
    async register(req, res) {
        try {
            const { username, email, password, age, fathersName, mothersName, phoneNo, place, district, role, } = req.body;
            if (!username || !email || !password) {
                res.status(400).json({ success: false, error: 'Username, email, and password are required' });
                return;
            }
            const user = await AuthService_1.default.register({
                username,
                email,
                password,
                age,
                fathersName,
                mothersName,
                phoneNo,
                place,
                district,
                role,
            });
            res.status(201).json({ success: true, data: { message: 'User created successfully', user } });
        }
        catch (error) {
            console.error('Register error:', error.message);
            const message = error.message;
            if (message === 'Email already exists') {
                res.status(400).json({ success: false, error: 'Email already exists' });
            }
            else if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                res.status(400).json({ success: false, error: `${field} already exists` });
            }
            else {
                res.status(500).json({ success: false, error: 'Registration failed' });
            }
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, error: 'Email and password are required' });
                return;
            }
            const { token, user } = await AuthService_1.default.login(email, password);
            res.json({ success: true, data: { token, user } });
        }
        catch (error) {
            const message = error.message;
            if (message === 'Email not found') {
                res.status(404).json({ success: false, error: 'Email not found' });
            }
            else if (message === 'Incorrect password') {
                res.status(401).json({ success: false, error: 'Incorrect password' });
            }
            else {
                res.status(500).json({ success: false, error: 'Login failed' });
            }
        }
    }
    async getCurrentUser(req, res) {
        try {
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const user = await AuthService_1.default.getUserById(req.user.id);
            if (!user) {
                throw new Error('User not found');
            }
            res.json({ success: true, data: user });
        }
        catch (error) {
            res.status(401).json({ success: false, error: error.message });
        }
    }
    async updateProfile(req, res) {
        try {
            const { age, fathersName, mothersName, phoneNo, place, district } = req.body;
            if (!req.user || !req.user.id) {
                throw new Error('User not authenticated');
            }
            const updatedUser = await AuthService_1.default.updateProfile(req.user.id, {
                age,
                fathersName,
                mothersName,
                phoneNo,
                place,
                district,
            });
            res.json({ success: true, data: updatedUser });
        }
        catch (error) {
            console.error('Update profile error:', error.message);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
exports.default = new AuthController();
