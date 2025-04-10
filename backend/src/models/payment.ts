import mongoose, { Schema, model } from 'mongoose';

interface IPayment {
  user_id: mongoose.Types.ObjectId;
  amount: number;
  credits_added: number;
  timestamp: Date;
}

const paymentSchema = new Schema<IPayment>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  credits_added: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model<IPayment>('Payment', paymentSchema);