import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorId = Date.now().toString(36);
  logger.error('Server error:', { 
    error: err, 
    errorId,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message,
      errorId
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    errorId,
    retry: true
  });
};
