"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// repositories/UserRepository.ts
const User_1 = __importDefault(require("../models/User"));
class UserRepository {
    async findByEmail(email) {
        return User_1.default.findOne({ email }).lean();
    }
    async findById(id) {
        return User_1.default.findById(id).select('-password').lean();
    }
    async findAll() {
        return User_1.default.find({ role: { $ne: 'admin' } }) // Exclude admin users
            .select('-password')
            .lean();
    }
    async create(userData) {
        const user = new User_1.default(userData);
        return user.save();
    }
    async updateById(id, updateData) {
        const user = await User_1.default.findById(id);
        if (!user)
            return null;
        user.set(updateData);
        return user.save();
    }
}
exports.default = new UserRepository();
