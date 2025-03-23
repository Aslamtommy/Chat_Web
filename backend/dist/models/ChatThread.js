"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    message_type: { type: String, enum: ['text', 'image'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
const chatThreadSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [messageSchema],
});
exports.default = (0, mongoose_1.model)('ChatThread', chatThreadSchema);
