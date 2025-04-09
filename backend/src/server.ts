import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/adminRoutes';
import ChatService from './services/ChatService';
import StorageService from './services/StorageService';
import dotenv from 'dotenv';
import ChatRepository from './repositories/ChatRepository';
import ChatThread from './models/ChatThread';
import { IChatThread, IMessage } from './types';

declare module 'express' {
  export interface Request {
    user?: { id: string; role: string };
  }
}

dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL;

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running');
});

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Error: MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

io.use((socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('[Server] Socket auth token received:', token);
  if (!token) return next(new Error('Authentication error: No token provided'));
  try {
    const secret = process.env.JWT_SECRET || 'mysecret';
    console.log('[Server] Verifying token with secret:', secret);
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    console.log('[Server] Decoded token:', decoded);
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('[Server] Token verification failed:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

const syncUnreadCounts = async (socket: Socket) => {
  try {
    console.log('[Server] Syncing unread counts for admin socket:', socket.id);
    const allUsers = await mongoose.model('User').find({ role: 'user' });
    const unreadCounts: { [key: string]: number } = {};
    for (const user of allUsers) {
      const uid = user._id.toString();
      const count = await ChatRepository.getUnreadCount(uid);
      console.log('[Server] Unread count for user:', uid, 'is:', count);
      unreadCounts[uid] = count;
    }
    console.log('[Server] Emitting initialUnreadCounts to admin:', unreadCounts);
    socket.emit('initialUnreadCounts', unreadCounts);
  } catch (error) {
    console.error('[Server] Error syncing unread counts:', error);
  }
};

io.on('connection', (socket: Socket) => {
  const userId = socket.data.user.id;
  const isAdmin = socket.data.user.role === 'admin';

  console.log('[Server] User connected:', userId, 'role:', socket.data.user.role, 'socketId:', socket.id);
  socket.join(userId);
  if (isAdmin) {
    console.log('[Server] Admin joined, syncing unread counts');
    socket.join('admin-room');
    syncUnreadCounts(socket);
  }

  socket.on('getChatHistory', async () => {
    try {
      console.log('[Server] getChatHistory requested by:', userId);
      const chat = await ChatService.getOrCreateChat(userId);
      console.log('[Server] Sending chat history to:', userId, 'data:', chat);
      socket.emit('chatHistory', chat);
    } catch (error) {
      console.error('[Server] Error fetching chat history:', error);
    }
  });

  socket.on('syncUnreadCounts', () => {
    if (isAdmin) {
      console.log('[Server] Admin requested syncUnreadCounts, socket:', socket.id);
      syncUnreadCounts(socket);
    }
  });

  socket.on('sendMessage', async ({ targetUserId, messageType, content, duration, tempId }, ack) => {
    try {
      console.log('[Server] sendMessage received from:', userId, 'to:', targetUserId, 'type:', messageType, 'tempId:', tempId);
      const senderId = socket.data.user.id;
      const isAdmin = socket.data.user.role === 'admin';
      const chatThreadId = isAdmin ? targetUserId : senderId;

      let finalContent = content;
      if (messageType === 'image' || messageType === 'voice') {
        if (!(content instanceof Buffer)) {
          throw new Error('File content must be a Buffer for image or voice messages');
        }
        console.log('[Server] Uploading file for:', messageType);
        finalContent = await StorageService.uploadFileFromSocket(content, messageType === 'image' ? 'image' : 'audio');
      }

      const updatedChat = await ChatService.saveMessage(chatThreadId, senderId, messageType, finalContent, duration);
      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];

      const messagePayload = {
        _id: newMessage._id.toString(),
        chatId: updatedChat._id.toString(),
        senderId,
        content: newMessage.content,
        messageType: newMessage.message_type,
        duration: newMessage.duration,
        timestamp: newMessage.timestamp,
        status: 'delivered',
        isAdmin,
        read: newMessage.read_by_admin,
      };

      if (isAdmin) {
        console.log('[Server] Emitting newMessage to user:', targetUserId);
        io.to(targetUserId).emit('newMessage', { ...messagePayload, isSelf: false });
        socket.emit('messageDelivered', { ...messagePayload, isSelf: true });
      } else {
        console.log('[Server] Emitting newMessage to admin-room');
        io.to('admin-room').emit('newMessage', { ...messagePayload, isSelf: false });
        socket.emit('messageDelivered', { ...messagePayload, isSelf: true });
        const unreadCount = await ChatRepository.getUnreadCount(chatThreadId);
        console.log('[Server] Emitting updateUnreadCount for:', chatThreadId, 'count:', unreadCount);
        io.to('admin-room').emit('updateUnreadCount', { userId: chatThreadId, unreadCount });
      }
      ack?.({ status: 'success', message: messagePayload });

      console.log('[Server] Emitting updateUserOrder for:', chatThreadId);
      io.to('admin-room').emit('updateUserOrder', {
        userId: chatThreadId,
        timestamp: newMessage.timestamp,
      });
    } catch (error: any) {
      console.error('[Server] Error in sendMessage:', error.message);
      socket.emit('messageError', { tempId, error: error.message });
      ack?.({ status: 'error', error: error.message });
    }
  });

  socket.on('editMessage', async ({ messageId, content }, ack) => {
    try {
      console.log('[Server] editMessage received for:', messageId, 'content:', content);
      const senderId = socket.data.user.id;
      const chat = await ChatThread.findOne({ 'messages._id': messageId }) as IChatThread | null;
      if (!chat || !chat.messages.find((msg) => msg._id?.toString() === messageId)) {
        throw new Error('Message not found');
      }
      if (chat.messages.find((msg) => msg._id?.toString() === messageId)!.sender_id.toString() !== senderId) {
        throw new Error('You can only edit your own messages');
      }

      const updatedMessage = await ChatService.editMessage(messageId, content);
      const messagePayload = {
        _id: updatedMessage._id.toString(),
        content: updatedMessage.content,
        isEdited: true,
      };

      console.log('[Server] Emitting messageEdited to:', chat.user_id.toString());
      io.to(chat.user_id.toString()).emit('messageEdited', messagePayload);
      io.to('admin-room').emit('messageEdited', messagePayload);
      ack?.({ status: 'success', message: messagePayload });
    } catch (error) {
      console.error('[Server] Error in editMessage:', error);
      ack?.({ status: 'error', error: (error as Error).message });
    }
  });

  socket.on('deleteMessage', async ({ messageId }, ack) => {
    try {
      console.log('[Server] deleteMessage received for:', messageId);
      const senderId = socket.data.user.id;
      const chat = await ChatThread.findOne({ 'messages._id': messageId }) as IChatThread | null;
      if (!chat || !chat.messages.find((msg) => msg._id?.toString() === messageId)) {
        throw new Error('Message not found');
      }
      if (chat.messages.find((msg) => msg._id?.toString() === messageId)!.sender_id.toString() !== senderId) {
        throw new Error('You can only delete your own messages');
      }

      await ChatService.deleteMessage(messageId);
      console.log('[Server] Emitting messageDeleted to:', chat.user_id.toString());
      io.to(chat.user_id.toString()).emit('messageDeleted', { messageId });
      io.to('admin-room').emit('messageDeleted', { messageId });
      ack?.({ status: 'success' });
    } catch (error) {
      console.error('[Server] Error in deleteMessage:', error);
      ack?.({ status: 'error', error: (error as Error).message });
    }
  });

  socket.on('markMessagesAsRead', async ({ chatId }) => {
    if (!isAdmin) return;
    console.log('[Server] markMessagesAsRead received for chatId:', chatId);
    await ChatRepository.markMessagesAsRead(chatId, userId);
    const unreadCount = await ChatRepository.getUnreadCount(chatId);
    console.log('[Server] Updated unread count after marking read:', unreadCount);
    io.to('admin-room').emit('updateUnreadCount', { userId: chatId, unreadCount });
    io.to(chatId).emit('messagesRead', { chatId, readBy: userId, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    console.log('[Server] User disconnected:', userId, 'socketId:', socket.id);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});

export default app;
export { io };