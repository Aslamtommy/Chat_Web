// models/Link.ts
import mongoose, { Schema, model } from 'mongoose';

interface ILink {
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

linkSchema.index({ createdAt: -1 });

export default model<ILink>('Link', linkSchema);