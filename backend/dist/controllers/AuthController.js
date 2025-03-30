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
            // Validate required fields
            const requiredFields = ['username', 'email', 'password', 'age', 'fathersName', 'mothersName', 'phoneNo', 'place', 'district'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`
                });
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
            res.status(201).json({
                success: true,
                data: {
                    message: 'User created successfully',
                    user: {
                        ...user,
                        password: undefined // Remove password from response
                    }
                }
            });
        }
        catch (error) {
            console.error('Register error:', error.message);
            const message = error.message;
            // Handle specific error cases
            if (message === 'Email already exists') {
                res.status(400).json({ success: false, error: 'Email already exists' });
            }
            else if (message === 'Invalid email format') {
                res.status(400).json({ success: false, error: 'Invalid email format' });
            }
            else if (message === 'Password must be at least 6 characters long') {
                res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
            }
            else if (message === 'Phone number must be 10 digits') {
                res.status(400).json({ success: false, error: 'Phone number must be 10 digits' });
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
            // Validate required fields
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
                return;
            }
            const { token, user } = await AuthService_1.default.login(email, password);
            // Remove password from user object before sending
            const userWithoutPassword = {
                ...user,
                password: undefined
            };
            res.json({
                success: true,
                data: {
                    token,
                    user: userWithoutPassword
                }
            });
        }
        catch (error) {
            const message = error.message;
            // Handle specific error cases
            if (message === 'Invalid email format') {
                res.status(400).json({ success: false, error: 'Invalid email format' });
            }
            else if (message === 'User not found') {
                res.status(404).json({ success: false, error: 'User not found' });
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
            // Remove password from user object before sending
            const userWithoutPassword = {
                ...user,
                password: undefined
            };
            res.json({ success: true, data: userWithoutPassword });
        }
        catch (error) {
            const message = error.message;
            if (message === 'User not authenticated') {
                res.status(401).json({ success: false, error: 'User not authenticated' });
            }
            else if (message === 'User not found') {
                res.status(404).json({ success: false, error: 'User not found' });
            }
            else {
                res.status(500).json({ success: false, error: 'Failed to get user data' });
            }
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
