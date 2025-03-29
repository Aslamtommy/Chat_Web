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
import ChatService from './services/ChatService'; // Import ChatService for real-time message handling
import dotenv from 'dotenv';
import ChatRepository from './repositories/ChatRepository';
declare module 'express' {
  export interface Request {
    user?: { id: string; role: string };
  }
}

dotenv.config();

const app: Express = express();
const server = http.createServer(app); // Create an HTTP server for Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://chat-web-beige.vercel.app', // Match your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Middleware
app.options('*', cors({
  origin: 'https://chat-web-beige.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cors({  
  origin: 'https://chat-web-beige.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'CORS test' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/upload', uploadRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
  console.log('GET / accessed');
  res.send('Backend is running');
});

// MongoDB Connection
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

// Socket.IO Authentication Middleware
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
  if (isAdmin) socket.join('admin-room');

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

      const chatThreadId = isAdmin ? targetUserId : recipientId;
      
      // Check for duplicate message
      const existingMessage = await ChatRepository.findMessageByContent(chatThreadId, content);
      if (existingMessage) {
        socket.emit('messageError', { tempId, error: 'Duplicate message detected' });
        return ack?.({ status: 'error', error: 'Duplicate message' });
      }

      const updatedChat = await ChatService.saveMessage(
        chatThreadId,
        senderId,
        messageType,
        content
      );

      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      if(newMessage._id ==undefined){
        console.log('newMessage._id is undefined');
        return ack?.({ status: 'error', error: 'Message not saved' });
      }
      const messagePayload = {
        _id: newMessage._id.toString(),
        chatId: updatedChat._id.toString(),
        senderId,
        content: newMessage.content,
        messageType: newMessage.message_type,
        timestamp: newMessage.timestamp,
        status: 'delivered'
      };

      const recipientRoom = isAdmin ? targetUserId : 'admin-room';
      
      // Prevent duplicate emission with once handler
      io.to(recipientRoom).emit('newMessage', {
        ...messagePayload,
        isAdmin: isAdmin
      });

      socket.emit('messageDelivered', {
        ...messagePayload,
        isAdmin: senderRole === 'admin',
        status: 'delivered'
      });

      // Enhanced admin notification
      if (!isAdmin) {
        io.to('admin-room').emit('newUserMessage', { 
          userId: senderId,
          message: messagePayload,
          timestamp: new Date().toISOString()
        });
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
  });
});
 
// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});

export default app;
export { io }; // Export io for potential use in controllers or services