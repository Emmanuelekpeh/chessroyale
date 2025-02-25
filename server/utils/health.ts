import express from 'express';
import { db } from '../db/connection';
import { logger } from './logger';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const startTime = process.hrtime();
    
    // Check database connection
    await db.execute('SELECT 1');
    
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime.toFixed(2)}ms`,
      database: 'connected',
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    };

    res.json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
