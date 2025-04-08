import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request to include user property
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token received in middleware:', token); // Debug

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'mysecret';
    console.log('JWT_SECRET used:', secret); // Debug to confirm secret
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    console.log('Decoded token:', decoded); // Debug decoded payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export default authMiddleware;