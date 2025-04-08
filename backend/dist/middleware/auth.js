"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received in middleware:', token); // Debug
    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    try {
        const secret = process.env.JWT_SECRET || 'mysecret';
        console.log('JWT_SECRET used:', secret); // Debug to confirm secret
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        console.log('Decoded token:', decoded); // Debug decoded payload
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
exports.default = authMiddleware;
