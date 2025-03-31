import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/adminRoutes';
import ChatService from './services/ChatService';
import dotenv from 'dotenv';
import ChatRepository from './repositories/ChatRepository';

declare module 'express' {
  export interface Request {
    user?: { id: string; role: string };
  }
}

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL;
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
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

io.use((socket, next) => {
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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.user.id} (${socket.data.user.role})`);
  
  const userId = socket.data.user.id;
  const isAdmin = socket.data.user.role === 'admin';
  
  socket.join(userId);
  if (isAdmin) {
    socket.join('admin-room');
    console.log(`Admin ${userId} joined admin-room`);
    socket.emit('requestSyncUnreadCounts');
  }

  if (isAdmin) {
    socket.on('syncUnreadCounts', async () => {
      try {
        console.log(`Syncing unread counts for admin ${userId}`);
        const allUsers = await mongoose.model('User').find({ role: 'user' });
        const unreadCounts: { [key: string]: number } = {};
        for (const user of allUsers) {
          const uid = user._id.toString();
          const count = await ChatRepository.getUnreadCount(uid);
          unreadCounts[uid] = count;
        }
        socket.emit('initialUnreadCounts', unreadCounts);
      } catch (error) {
        console.error('Error syncing unread counts:', error);
      }
    });
  }
  socket.on('requestScreenshot', ({ userId: targetUserId }) => {
    if (!isAdmin) return; // Only admins can request screenshots
    io.to(targetUserId).emit('screenshotRequested');
  });
  socket.on('screenshotUploaded', ({ userId, messageId }) => {
    io.to(userId).emit('screenshotFulfilled');
    io.to('admin-room').emit('screenshotFulfilled', { userId, messageId });
  });

  socket.on('markMessagesAsRead', async ({ chatId }) => {
    try {
      if (!isAdmin) {
        console.log(`Non-admin ${userId} attempted to mark messages as read`);
        return;
      }
      
      await ChatRepository.markMessagesAsRead(chatId, userId);
      const unreadCount = await ChatRepository.getUnreadCount(chatId);
      io.to('admin-room').emit('updateUnreadCount', {
        userId: chatId,
        unreadCount, // Should be 0 if all messages are read
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

  socket.on('sendMessage', async ({ targetUserId, messageType, content, tempId }, ack) => {
    try {
      const senderId = socket.data.user.id;
      const senderRole = socket.data.user.role;

      if (!['text', 'image', 'voice'].includes(messageType)) {
        throw new Error('Invalid message type');
      }

      let recipientId = targetUserId;
      if (!recipientId && !isAdmin) {
        const admin = await mongoose.model('User').findOne({ role: 'admin' });
        if (!admin) throw new Error('No admin available');
        recipientId = admin._id.toString();
      }

      const chatThreadId = isAdmin ? targetUserId : senderId;

      // Save the message
      const updatedChat = await ChatService.saveMessage(
        chatThreadId,
        senderId,
        messageType,
        content
      );

      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      if (!newMessage._id) {
        console.log('Message not saved properly');
        return ack?.({ status: 'error', error: 'Message not saved' });
      }

      const messagePayload = {
        _id: newMessage._id.toString(),
        chatId: updatedChat._id.toString(),
        senderId,
        content: newMessage.content,
        messageType: newMessage.message_type,
        timestamp: newMessage.timestamp,
        status: 'delivered',
        isAdmin: isAdmin,
        read: false, // Initially unread
      };

      // Emit to all relevant parties
      if (isAdmin) {
        io.to(targetUserId).emit('newMessage', messagePayload);
      } else {
        io.to('admin-room').emit('newMessage', messagePayload);
      }
      
      socket.emit('messageDelivered', messagePayload);

      // Update unread count only if the admin isn’t viewing the chat
      if (!isAdmin) {
        const adminSockets = Array.from(io.sockets.sockets.values()).filter(s => 
          s.data.user?.role === 'admin' && s.rooms.has(chatThreadId)
        );
        if (adminSockets.length === 0) { // No admin is viewing this chat
          const unreadCount = await ChatRepository.getUnreadCount(chatThreadId);
          io.to('admin-room').emit('updateUnreadCount', {
            userId: chatThreadId,
            unreadCount,
          });
        } else {
          // Admin is viewing, mark as read immediately
          await ChatRepository.markMessagesAsRead(chatThreadId, adminSockets[0].data.user.id);
          io.to('admin-room').emit('updateUnreadCount', {
            userId: chatThreadId,
            unreadCount: 0,
          });
        }
      }

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