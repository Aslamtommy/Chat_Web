import express, { Express, Request, Response, NextFunction } from 'express';
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

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();

// Define allowed origins
const allowedOrigins = [
  'frontend-one-sigma-38.vercel.app', // Local frontend
];

// Manual CORS middleware (force headers)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${origin}`);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback for testing
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    res.status(200).end();
    return;
  }
  next();
});

// Fallback CORS package (optional redundancy)
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS package - Origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/user/auth', authRoutes);
app.use('/user/chat', chatRoutes);
app.use('/user/upload', uploadRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  console.log('GET / accessed');
  res.send('Backend is running');
});

// MongoDB connection (skip in Vercel build phase)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Local testing only
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server started on port ${port} with HTTP`);
  });
}

export default app;