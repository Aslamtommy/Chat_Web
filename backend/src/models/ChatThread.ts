import mongoose, { Schema, model } from 'mongoose';
import { IChatThread, IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message_type: { type: String, enum: ['text', 'image', 'voice'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read_by_admin: { type: Boolean, default: false }, // Default is false
});

// Add index for faster message queries
messageSchema.index({ timestamp: 1 });
messageSchema.index({ read_by_admin: 1 });

const chatThreadSchema = new Schema<IChatThread>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [messageSchema],
  last_read_by_admin: { type: Date, default: null },
});

// Add compound indexes for common query patterns
chatThreadSchema.index({ user_id: 1, 'messages.timestamp': -1 });
chatThreadSchema.index({ user_id: 1, last_read_by_admin: 1 });
chatThreadSchema.index({ 'messages.read_by_admin': 1, user_id: 1 });

export default model<IChatThread>('ChatThread', chatThreadSchema);