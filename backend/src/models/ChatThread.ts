import mongoose, { Schema, model } from 'mongoose';
import { IChatThread, IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_type: { type: String, enum: ['text', 'image', 'voice'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatThreadSchema = new Schema<IChatThread>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
});

export default model<IChatThread>('ChatThread', chatThreadSchema);