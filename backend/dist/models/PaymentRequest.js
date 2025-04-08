"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paymentRequestSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    paymentDetails: {
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true },
        amount: { type: String, required: true },
        name: { type: String, required: true },
        upiId: { type: String, required: true },
    },
    status: { type: String, enum: ['pending', 'uploaded'], default: 'pending' },
    screenshotUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
paymentRequestSchema.index({ userId: 1, status: 1 });
paymentRequestSchema.index({ adminId: 1 });
exports.default = (0, mongoose_1.model)('PaymentRequest', paymentRequestSchema);
