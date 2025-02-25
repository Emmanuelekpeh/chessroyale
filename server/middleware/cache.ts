import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default TTL

export const cacheMiddleware = (duration: number = 600) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__cache__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const originalJson = res.json;
    res.json = function(body: any): Response {
      cache.set(key, body, duration);
      return originalJson.call(this, body);
    };

    next();
  };
};
