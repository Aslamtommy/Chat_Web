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
exports.default = handler;
const AuthService_1 = __importDefault(require("../../services/AuthService")); // Path relative to src/api/user/
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        // Handle POST request for registration
        if (req.method === 'POST') {
            try {
                const user = yield AuthService_1.default.register(req.body);
                res.status(201).json({ message: 'User created', user });
            }
            catch (error) {
                console.error('Register error:', error.message);
                if (error.code === 11000) {
                    // MongoDB duplicate key error
                    const field = Object.keys(error.keyValue)[0];
                    res.status(400).json({ error: `${field} already exists` });
                }
                else {
                    res.status(400).json({ error: error.message });
                }
            }
        }
        else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    });
}
