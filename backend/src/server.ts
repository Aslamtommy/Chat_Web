import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import dotenv from 'dotenv';

// Extend Express Request interface to include user property
declare module 'express' {
  export interface Request {
    user?: { id: string; role: string };
  }
}

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app: Express = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Adjust to match your frontend port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Define routes
app.use('/user/auth', authRoutes);
app.use('/user/chat', chatRoutes);
app.use('/user/upload', uploadRoutes);

// MongoDB connection (skip during Vercel build phase)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Define port
const port = process.env.PORT || 5000;

// Start the Express server with HTTP
app.listen(port, () => {
  console.log(`Server started on port ${port} with HTTP`);
});

// Export app for Vercel or other serverless environments
export default app;