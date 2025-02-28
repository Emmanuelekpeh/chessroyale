import express from "express";
import { json, urlencoded } from "express";
import cors from "cors";
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { createServer } from "http";
import config from "../config";
import healthRouter from "./utils/health";
import { findFreePort } from "./utils/port";
import { logger } from "./utils/logger";

const app = express();

async function initializeServer() {
  try {
    logger.info('Starting server initialization...');

    // Find a free port with our optimized implementation
    const PORT = await findFreePort(config.server.port);
    logger.info(`Found free port: ${PORT}`);

    // Basic middleware setup
    logger.info('Setting up middleware...');
    app.use(cors());
    app.use(compression());
    app.use(json());
    app.use(urlencoded({ extended: false }));

    // Register health router first
    app.use('/api', healthRouter);

    // Rate limiting
    logger.info('Configuring rate limiting...');
    const limiter = rateLimit({
      windowMs: config.server.rateLimit.windowMs,
      max: config.server.rateLimit.max,
      message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api/', limiter);

    // Request timeout middleware
    app.use((req, res, next) => {
      req.setTimeout(config.server.timeout, () => {
        res.status(408).json({ error: 'Request timeout' });
      });
      next();
    });

    // Error handling middleware
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const errorId = Date.now().toString(36);
      logger.error('Server error:', { 
        error: err, 
        errorId,
        stack: err.stack,
        path: _req.path,
        method: _req.method
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
    });

    // Create HTTP server
    logger.info('Creating HTTP server...');
    const server = createServer(app);

    // Setup routes and Vite
    logger.info('Registering routes...');
    await registerRoutes(app);
    logger.info('Setting up Vite...');
    await setupVite(app, server);

    // Start server with graceful shutdown
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running on port ${PORT} (http://0.0.0.0:${PORT})`);
        resolve(serverInstance);
      });

      serverInstance.on('error', (error: NodeJS.ErrnoException) => {
        logger.error('Server startup error:', { error });
        reject(error);
      });

      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        serverInstance.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      });

      process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception:', error);
        serverInstance.close(() => {
          process.exit(1);
        });
      });
    });

  } catch (error) {
    logger.error('Fatal error during server initialization:', { error });
    process.exit(1);
  }
}

// Start server with retries
async function startWithRetries(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Starting server attempt ${attempt}/${maxRetries}`);
      await initializeServer();
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error('Failed to start server after all retries');
        process.exit(1);
      }
      logger.warn(`Retrying in 1 second... (${maxRetries - attempt} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

startWithRetries().catch(error => {
  logger.error('Unhandled error during server startup:', { error });
  process.exit(1);
});