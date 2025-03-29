"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// services/AdminService.ts (optional)
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const ChatService_1 = __importDefault(require("./ChatService"));
class AdminService {
    async getAllUsers() {
        return UserRepository_1.default.findAll(); // Add this method to UserRepository if needed
    }
    async getAllChats() {
        return ChatService_1.default.getAllChats();
    }
}
exports.default = new AdminService();
