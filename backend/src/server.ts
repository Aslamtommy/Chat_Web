import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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

// Logging middleware
app.use((req, res, next) => {
  console.log('Request:', req.method, req.url, 'Origin:', req.headers.origin);
  res.on('finish', () => {
    console.log('Response Headers:', res.getHeaders());
  });
  next();
});

// Explicit OPTIONS handling
app.options('*', cors({
  origin: 'https://chat-web-beta-ten.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// CORS middleware
app.use(cors({
  origin: 'https://chat-web-beta-ten.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/upload', uploadRoutes);

app.get('/', (req: Request, res: Response) => {
  console.log('GET / accessed');
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

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port} with HTTP`);
});

export default app;