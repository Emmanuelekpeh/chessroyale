import rateLimit from 'express-rate-limit';
import config from '../../config';

export const rateLimiter = rateLimit({
  windowMs: config.server.rateLimit.windowMs,
  max: config.server.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
