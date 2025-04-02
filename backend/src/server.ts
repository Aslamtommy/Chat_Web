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
import dotenv from 'dotenv';
import ChatRepository from './repositories/ChatRepository';
import ChatThread from './models/ChatThread';
import { IChatThread, IMessage } from './types'; // Import your types

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
  if (!token) return next(new Error('Authentication error: No token provided'));
  try {
    const decoded = jwt.verify(token, 'mysecret') as { id: string; role: string };
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

const syncUnreadCounts = async (socket: Socket) => {
  try {
    const allUsers = await mongoose.model('User').find({ role: 'user' });
    const unreadCounts: { [key: string]: number } = {};
    
    for (const user of allUsers) {
      const uid = user._id.toString();
      const count = await ChatRepository.getUnreadCount(uid);
      unreadCounts[uid] = count;
    }
    
    console.log('Sending unread counts to admin:', unreadCounts);
    socket.emit('initialUnreadCounts', unreadCounts);
  } catch (error) {
    console.error('Error syncing unread counts:', error);
  }
};

io.on('connection', (socket: Socket) => {
  const userId = socket.data.user.id;
  const isAdmin = socket.data.user.role === 'admin';
  
  console.log(`User connected: ${userId} (${socket.data.user.role})`);
  
  socket.join(userId);
  if (isAdmin) {
    socket.join('admin-room');
    console.log(`Admin ${userId} joined admin-room`);
    syncUnreadCounts(socket); // Sync immediately on connection
  }

  socket.on('syncUnreadCounts', () => {
    if (isAdmin) {
      console.log(`Admin ${userId} requested unread count sync`);
      syncUnreadCounts(socket);
    }
  });

  // socket.on('requestScreenshot', ({ userId: targetUserId, paymentDetails }) => {
  //   if (!isAdmin) return;
  //   console.log(`Admin requested screenshot from ${targetUserId} with details:`, paymentDetails);
  //   io.to(targetUserId).emit('screenshotRequested', { userId: targetUserId, paymentDetails });
  // });

  socket.on('screenshotUploaded', ({ userId, messageId }) => {
    io.to(userId).emit('screenshotFulfilled');
    io.to('admin-room').emit('screenshotFulfilled', { userId, messageId });
  });

  socket.on('markMessagesAsRead', async ({ chatId }) => {
    try {
      if (!isAdmin) return;
      
      await ChatRepository.markMessagesAsRead(chatId, userId);
      const unreadCount = await ChatRepository.getUnreadCount(chatId);
      
      console.log(`Messages marked as read for chat ${chatId}, new count: ${unreadCount}`);
      io.to('admin-room').emit('updateUnreadCount', {
        userId: chatId,
        unreadCount,
      });
      io.to(chatId).emit('messagesRead', { 
        chatId,
        readBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('editMessage', async ({ messageId, content }, ack) => {
    try {
      const senderId = socket.data.user.id;
      const chat = await ChatThread.findOne({ 'messages._id': messageId }) as IChatThread | null;
      if (!chat) {
        throw new Error('Chat thread not found');
      }

      // Find the message in the messages array (since id() may not work with TypeScript)
      const message = chat.messages.find((msg: IMessage) => msg._id?.toString() === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sender_id.toString() !== senderId) {
        throw new Error('You can only edit your own messages');
      }

      const updatedMessage = await ChatService.editMessage(messageId, content);
      const messagePayload = {
        _id: updatedMessage._id.toString(),
        content: updatedMessage.content,
        isEdited: true,
      };

      const targetUserId = chat.user_id.toString();
      io.to(targetUserId).emit('messageEdited', messagePayload);
      io.to('admin-room').emit('messageEdited', messagePayload);
      ack?.({ status: 'success', message: messagePayload });
    } catch (error) {
      socket.emit('messageError', { error: (error as Error).message });
      ack?.({ status: 'error', error: (error as Error).message });
    }
  });

  socket.on('deleteMessage', async ({ messageId }, ack) => {
    console.log('Server received deleteMessage event for messageId:', messageId); // Add this
    try {
      const senderId = socket.data.user.id;
      const chat = await ChatThread.findOne({ 'messages._id': messageId }) as IChatThread | null;
      if (!chat) {
        throw new Error('Chat thread not found');
      }
      const message = chat.messages.find((msg: IMessage) => msg._id?.toString() === messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      if (message.sender_id.toString() !== senderId) {
        throw new Error('You can only delete your own messages');
      }
      await ChatService.deleteMessage(messageId);
      const targetUserId = chat.user_id.toString();
      console.log(`Emitting messageDeleted to user ${targetUserId} and admin-room for messageId: ${messageId}`); // Already present
      io.to(targetUserId).emit('messageDeleted', { messageId });
      io.to('admin-room').emit('messageDeleted', { messageId });
      ack?.({ status: 'success' });
    } catch (error) {
      console.error('Error in deleteMessage:', (error as Error).message);
      socket.emit('messageError', { error: (error as Error).message });
      ack?.({ status: 'error', error: (error as Error).message });
    }
  });

  socket.on('sendMessage', async ({ targetUserId, messageType, content, tempId }, ack) => {
    try {
      const senderId = socket.data.user.id;
      const senderRole = socket.data.user.role;
      const isAdmin = senderRole === 'admin';
      const chatThreadId = isAdmin ? targetUserId : senderId;

      if (!['text', 'image', 'voice'].includes(messageType)) {
        throw new Error('Invalid message type');
      }

      const updatedChat = await ChatService.saveMessage(
        chatThreadId,
        senderId,
        messageType,
        content
      );

      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      if (!newMessage || !newMessage._id) {
        throw new Error('Message ID is missing or invalid');
      }

      const messagePayload = {
        _id: newMessage._id.toString(),
        chatId: updatedChat._id.toString(),
        senderId,
        content: newMessage.content,
        messageType: newMessage.message_type,
        timestamp: newMessage.timestamp,
        status: 'delivered',
        isAdmin,
        read: isAdmin ? true : false,
      };

      if (isAdmin) {
        io.to(targetUserId).emit('newMessage', messagePayload);
      } else {
        io.to('admin-room').emit('newMessage', messagePayload);
        const unreadCount = await ChatRepository.getUnreadCount(chatThreadId);
        console.log(`User message sent, updating unread count for ${chatThreadId} to ${unreadCount}`);
        io.to('admin-room').emit('updateUnreadCount', {
          userId: chatThreadId,
          unreadCount,
        });
        syncUnreadCounts(socket); // Ensure all admins get updated counts
      }
      socket.emit('messageDelivered', messagePayload);
      ack?.({ status: 'success', message: messagePayload });
    } catch (error: any) {
      console.error('Message sending error:', error);
      socket.emit('messageError', { tempId, error: error.message });
      ack?.({ status: 'error', error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    if (isAdmin) {
      console.log(`Admin ${userId} left admin-room`);
    }
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});

export default app;
export { io };