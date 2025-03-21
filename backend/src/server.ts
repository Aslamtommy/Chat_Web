import express, { Express } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import socketHandler from './sockets';
import dotenv from 'dotenv';

import { JwtPayload } from 'jsonwebtoken';

declare module 'express' {
  export interface Request {
    user?: { id: string; role: string }; // Matches JWT payload
  }
}
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(express.json());
app.use('/user/auth', authRoutes);
app.use('/user/chat', chatRoutes);
app.use('/user/upload', uploadRoutes);

socketHandler(io);

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));