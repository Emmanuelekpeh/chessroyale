import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db';
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Server } from 'socket.io';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { createClient } from 'redis';
import connectRedis from 'connect-redis';
import { v4 as uuidv4 } from 'uuid';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import gameRoutes from './routes/games';
import puzzleRoutes from './routes/puzzles';

// Import socket handlers
import { setupSocketHandlers } from './socket';

// Import passport config
import './config/passport';

// Load environment variables
dotenv.config();

// Create Redis client
let RedisStore;
let redisClient;
if (process.env.REDIS_URL) {
  RedisStore = connectRedis(session);
  redisClient = createClient({ url: process.env.REDIS_URL });
  
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Connected to Redis'));
  
  (async () => {
    await redisClient.connect();
  })();
}

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Middleware
    app.use(helmet({
      contentSecurityPolicy: false // Modify as needed for your app
    }));
    app.use(morgan('dev'));
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    
    // Session configuration
    const sessionMiddleware = session({
      store: process.env.REDIS_URL ? new RedisStore({ client: redisClient }) : undefined,
      secret: process.env.SESSION_SECRET || 'chess-royale-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      },
      genid: () => uuidv4()
    });
    
    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Wrap socket.io with session middleware
    io.use((socket, next) => {
      sessionMiddleware(socket.request as any, {} as any, next as any);
    });
    
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/games', gameRoutes);
    app.use('/api/puzzles', puzzleRoutes);
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });
    
    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../client/build')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
      });
    }
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err);
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: {
          message: err.message || 'Internal Server Error',
          status: statusCode
        }
      });
    });
    
    // Set up socket handlers
    setupSocketHandlers(io);
    
    // Start server
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle shutdown gracefully
    const gracefulShutdown = async () => {
      console.log('Shutting down server...');
      // Close all database connections
      await pool.end();
      if (redisClient) {
        await redisClient.disconnect();
      }
      process.exit(0);
    };
    
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Add uncaught exception handlers for better reliability
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit here to allow graceful shutdown on critical errors
});

startServer();
