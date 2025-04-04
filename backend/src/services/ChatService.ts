// services/ChatService.ts
import ChatRepository from '../repositories/ChatRepository';
import { IChatThread, IMessage } from '../types';
import mongoose from 'mongoose';
import ChatThread from '../models/ChatThread';
import { v2 as cloudinary } from 'cloudinary';
class ChatService {
  async getOrCreateChat(userId: string): Promise<IChatThread> {
    let chat = await ChatRepository.findByUserId(userId);
    if (!chat) {
      chat = await ChatRepository.create(userId);
    }
    return chat;
  }

  async saveMessage(chatThreadId: string, senderId: any, messageType: 'text' | 'image' | 'voice', content: string,duration:any): Promise<IChatThread> {
    const message: IMessage = {
      sender_id: new mongoose.Types.ObjectId(senderId),
      message_type: messageType,
      content,
      duration,
      timestamp: new Date(),
    };

    // Set read_by_admin only if the sender is the user (chatThreadId represents the user ID)
    if (senderId.toString() === chatThreadId) {
      message.read_by_admin = false; // User-sent message, unread by admin
    } else {
      message.read_by_admin = true; // Admin-sent message, inherently "read" by admin
    }

    return ChatRepository.addMessage(chatThreadId, message);
  }

  async getAllChats(): Promise<IChatThread[]> {
    return ChatRepository.getAllThreads();
  }
  async editMessage(messageId: string, content: string): Promise<IMessage> {
    return ChatRepository.updateMessage(messageId, content);
  }
  
  async deleteMessage(messageId: string): Promise<void> {
    // Retrieve the message to check its type and content
    const chat = await ChatThread.findOne({ 'messages._id': messageId }) as IChatThread | null;
    if (!chat) throw new Error('Message not found');
    const message = chat.messages.find((msg) => msg._id?.toString() === messageId);
    if (!message) throw new Error('Message not found');

    // Check if the message is an image or voice record
    if (message.message_type === 'image' || message.message_type === 'voice') {
      try {
        const publicId = getPublicIdFromUrl(message.content);
        const resourceType = message.message_type === 'image' ? 'image' : 'video';
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`Deleted ${message.message_type} from Cloudinary: ${publicId}`);
      } catch (error) {
        console.error(`Failed to delete media from Cloudinary: ${error}`);
        // Log the error but proceed with database deletion
      }
    }

    // Mark the message as deleted in the database
    await ChatRepository.deleteMessage(messageId);
  }
  
}

function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL');
  let startIndex = uploadIndex + 1;
  // Skip version number if present (e.g., v1234567890)
  if (parts[startIndex].startsWith('v') && !isNaN(Number(parts[startIndex].slice(1)))) {
    startIndex++;
  }
  const publicIdWithExtension = parts.slice(startIndex).join('/');
  // Remove file extension
  const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
  return publicId;
}

export default new ChatService();