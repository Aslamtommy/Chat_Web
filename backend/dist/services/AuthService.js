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
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, 'mysecret', {
            expiresIn: '1h', // Add token expiration for security
        });
        return { token, user };
    }
    async getUserById(id) {
        const user = await UserRepository_1.default.findById(id);
        if (!user)
            return null;
        return user;
    }
    // In AuthService.ts
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
}
exports.default = new AuthService();
