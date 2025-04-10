// services/ChatService.ts
import ChatRepository from '../repositories/ChatRepository';
import { IChatThread, IMessage } from '../types';
import mongoose from 'mongoose';
import ChatThread from '../models/ChatThread';
import { v2 as cloudinary } from 'cloudinary';
import UserRepository from '../repositories/UserRepository';
class ChatService {
  async getOrCreateChat(userId: string): Promise<IChatThread> {
    let chat = await ChatRepository.findByUserId(userId);
    if (!chat) {
      chat = await ChatRepository.create(userId);
    }
    return chat;
  }

  async saveMessage(chatThreadId: string, senderId: any, messageType: 'text' | 'image' | 'voice', content: string, duration: any): Promise<IChatThread> {
 // Fetch user to check credits (only for non-admins, but we assume senderId === chatThreadId for users)
 const user = await UserRepository.findById(senderId);
 if (!user) throw new Error('User not found');
 
 // Skip credit check/deduction for admins
 const isAdmin = user.role === 'admin';
 if (!isAdmin && (user.message_credits ?? 0) <= 0) {
   throw new Error('Insufficient message credits');
 }

 const message: IMessage = {
   sender_id: new mongoose.Types.ObjectId(senderId),
   message_type: messageType,
   content,
   duration,
   timestamp: new Date(),
 };

 if (senderId.toString() === chatThreadId) {
   message.read_by_admin = false;
 } else {
   message.read_by_admin = true;
 }

 // Deduct 1 credit atomically for non-admin users
 if (!isAdmin) {
   const updateData: { message_credits: number } = { message_credits: -1 };
   const updatedUser = await UserRepository.updateById(senderId, { $inc: updateData });
   if (!updatedUser) throw new Error('Failed to deduct credits');
   console.log('[ChatService] Deducted 1 credit for user:', senderId, 'new credits:', updatedUser.message_credits);
 }

 // Add the message to the chat thread
 const updatedChat = await ChatRepository.addMessage(chatThreadId, message);
 console.log('[ChatService] Message saved for user:', chatThreadId, 'message ID:', updatedChat.messages[updatedChat.messages.length - 1]._id);
 return updatedChat;
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