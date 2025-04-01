"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image', 'voice'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read_by_admin: { type: Boolean, default: false }, // Default is false
});
// Add index for faster message queries
messageSchema.index({ timestamp: 1 });
messageSchema.index({ read_by_admin: 1 });
const chatThreadSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [messageSchema],
    last_read_by_admin: { type: Date, default: null },
});
// Add compound indexes for common query patterns
chatThreadSchema.index({ user_id: 1, 'messages.timestamp': -1 });
chatThreadSchema.index({ user_id: 1, last_read_by_admin: 1 });
chatThreadSchema.index({ 'messages.read_by_admin': 1, user_id: 1 });
exports.default = (0, mongoose_1.model)('ChatThread', chatThreadSchema);
