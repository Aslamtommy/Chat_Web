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
        // Validate password strength
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        // Validate phone number format
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNo)) {
            throw new Error('Phone number must be 10 digits');
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
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
        const user = await UserRepository_1.default.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Incorrect password');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, 'mysecret', {
            expiresIn: '1h',
        });
        return { token, user };
    }
    async getUserById(id) {
        const user = await UserRepository_1.default.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async updateProfile(userId, profileData) {
        // Convert age to number if it exists and is a string
        if (profileData.age) {
            const ageAsNumber = Number(profileData.age);
            // Validate the number
            if (isNaN(ageAsNumber) || ageAsNumber <= 0) {
                throw new Error('Age must be a valid number');
            }
            // Assign the converted value
            profileData.age = ageAsNumber;
        }
        // Fetch the existing user
        const existingUser = await UserRepository_1.default.findById(userId);
        if (!existingUser) {
            throw new Error('User not found');
        }
        const updateData = {
            age: profileData.age,
            fathersName: profileData.fathersName || existingUser.fathersName,
            mothersName: profileData.mothersName || existingUser.mothersName,
            phoneNo: profileData.phoneNo || existingUser.phoneNo,
            place: profileData.place || existingUser.place,
            district: profileData.district || existingUser.district,
        };
        const updatedUser = await UserRepository_1.default.updateById(userId, updateData);
        if (!updatedUser) {
            throw new Error('Failed to update user');
        }
        const { password, ...userWithoutPassword } = updatedUser.toObject();
        return userWithoutPassword;
    }
    async findByEmail(email) {
        const user = await UserRepository_1.default.findByEmail(email);
        console.log('findByEmail result for', email, ':', user); // Debug log
        return user;
    }
}
exports.default = new AuthService();
