/**
 * Application Configuration
 * This file contains all configurable parameters for the ChessCrunch application.
 */

interface Config {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
  };
  database: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
  };
  auth: {
    sessionSecret: string;
    sessionDuration: number;
    maxAttempts: number;
    lockoutDuration: number;
  };
  game: {
    timeControls: {
      bullet: number;
      blitz: number;
      rapid: number;
      classical: number;
    };
    ratingK: {
      provisional: number;
      established: number;
    };
  };
  logging: {
    level: string;
    path: string;
    maxSize: string;
    maxFiles: number;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    }
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/chessroyale',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10)
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    sessionDuration: parseInt(process.env.SESSION_DURATION || '86400000', 10), // 24 hours
    maxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION || '900000', 10) // 15 minutes
  },
  game: {
    timeControls: {
      bullet: 60 * 1, // 1 minute
      blitz: 60 * 5, // 5 minutes
      rapid: 60 * 15, // 15 minutes
      classical: 60 * 30 // 30 minutes
    },
    ratingK: {
      provisional: 40,
      established: 20
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    path: process.env.LOG_PATH || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10)
  }
};

export default config;
