// backend/src/middleware/auth.ts
import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { AuthenticatedRequest } from '../types/auth';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    req.userId = decoded.userId;
    next();
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};