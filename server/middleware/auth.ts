import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export async function validateUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.body.userId || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const user = await storage.getUser(Number(userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}
