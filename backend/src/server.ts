// server.ts
import express, { Express } from 'express';
import mongoose from 'mongoose';
import http from 'http';
import cors from 'cors';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import dotenv from 'dotenv';

declare module 'express' {
  export interface Request {
    user?: { id: string; role: string };
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

app.use(express.json());
app.use('/user/auth', authRoutes);
app.use('/user/chat', chatRoutes);
app.use('/user/upload', uploadRoutes);

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));