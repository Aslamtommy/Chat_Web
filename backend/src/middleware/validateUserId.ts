// middleware/validateUserId.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }
  next();
};