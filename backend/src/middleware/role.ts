import { Request, Response, NextFunction } from 'express';

export const adminRoleMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admins only' });
  }
  next();
};