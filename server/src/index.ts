import express from "express";
import { json, urlencoded } from "express";
import cors from "cors";
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { setupAuth } from "./auth";
import { setupVite } from "./vite";
import { createServer } from "http";
import healthRouter from "./health";

const app = express();

async function initializeServer() {
  try {
    console.info('Starting server initialization...');

    // Use environment variable for port
    const PORT = parseInt(process.env.PORT || '3000', 10);
    console.info(`Using port: ${PORT}`);

    // Basic middleware setup
    console.info('Setting up middleware...');
    app.use(cors());
    app.use(compression());
    app.use(json());
    app.use(urlencoded({ extended: false }));

    // Register health router first
    app.use('/api', healthRouter);

    // Rate limiting
    console.info('Configuring rate limiting...');
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api/', limiter);

    // Request timeout middleware
    app.use((req, res, next) => {
      req.setTimeout(30000, () => { // 30 seconds timeout
        res.status(408).json({ error: 'Request timeout' });
      });
      next();
    });

    // Error handling middleware
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const errorId = Date.now().toString(36);
      console.error('Server error:', { 
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
    console.info('Creating HTTP server...');
    const server = createServer(app);

    // Setup auth and Vite
    console.info('Setting up authentication...');
    setupAuth(app);
    console.info('Setting up Vite...');
    await setupVite(app, server);

    // Start server with graceful shutdown
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen(PORT, '0.0.0.0', () => {
        console.info(`Server running on port ${PORT} (http://0.0.0.0:${PORT})`);
        resolve(serverInstance);
      });

      serverInstance.on('error', (error: NodeJS.ErrnoException) => {
        console.error('Server startup error:', error);
        reject(error);
      });

      process.on('SIGTERM', () => {
        console.info('SIGTERM received, shutting down gracefully');
        serverInstance.close(() => {
          console.info('Server closed');
          process.exit(0);
        });
      });

      process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        serverInstance.close(() => {
          process.exit(1);
        });
      });
    });

  } catch (error) {
    console.error('Fatal error during server initialization:', error);
    process.exit(1);
  }
}

// Start server with retries
async function startWithRetries(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.info(`Starting server attempt ${attempt}/${maxRetries}`);
      await initializeServer();
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Failed to start server after all retries');
        process.exit(1);
      }
      console.warn(`Retrying in 1 second... (${maxRetries - attempt} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

startWithRetries().catch(error => {
  console.error('Unhandled error during server startup:', error);
  process.exit(1);
});