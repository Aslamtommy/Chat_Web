import mongoose, { Schema, model } from 'mongoose';
import { IPaymentRequest } from '../types';

const paymentRequestSchema = new Schema<IPaymentRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paymentDetails: {
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    amount: { type: String, required: true },
    name: { type: String, required: true },
    upiId: { type: String },
  },
  status: { type: String, enum: ['pending', 'uploaded'], default: 'pending' },
  screenshotUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

paymentRequestSchema.index({ userId: 1, status: 1 });
paymentRequestSchema.index({ adminId: 1 });

export default model<IPaymentRequest>('PaymentRequest', paymentRequestSchema);