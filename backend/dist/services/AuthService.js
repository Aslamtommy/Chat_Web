"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
class AuthService {
    async register({ username, email, password, age, fathersName, mothersName, phoneNo, place, district, role, }) {
        // Check if email already exists
        const existingUser = await UserRepository_1.default.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await UserRepository_1.default.create({
            username,
            email,
            password: hashedPassword,
            age,
            fathersName,
            mothersName,
            phoneNo,
            place,
            district,
            role: role || 'user',
        });
        return user;
    }
    async login(email, password) {
        const user = await UserRepository_1.default.findByEmail(email);
        if (!user) {
            throw new Error('Email not found');
        }
        if (!(await bcryptjs_1.default.compare(password, user.password))) {
            throw new Error('Incorrect password');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h', // Add token expiration for security
        });
        return { token, user };
    }
    async getUserById(id) {
        const user = await UserRepository_1.default.findById(id);
        if (!user)
            return null;
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
}
exports.default = new AuthService();
