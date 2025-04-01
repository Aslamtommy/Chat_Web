"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/User.ts
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Added unique constraint
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    age: { type: Number, required: true },
    fathersName: { type: String, required: true },
    mothersName: { type: String, required: true },
    phoneNo: { type: String, required: true },
    place: { type: String, required: true },
    district: { type: String, required: true },
});
// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ username: 1 });
exports.default = (0, mongoose_1.model)('User', userSchema);
