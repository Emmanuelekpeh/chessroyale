import helmet from 'helmet';
import { Express } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../../config';

export const setupSecurity = (app: Express) => {
  // Add security headers
  app.use(helmet());
  
  // Rate limiting
  app.use('/api/', rateLimit({
    windowMs: config.server.rateLimit.windowMs,
    max: config.server.rateLimit.max,
    message: { error: 'Too many requests' }
  }));

  // CORS configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
};
