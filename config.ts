/**
 * Application Configuration
 * This file contains all configurable parameters for the ChessCrunch application.
 */

interface Config {
  database: {
    maxConnections: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    url?: string;
  };
  server: {
    port: number;
    host: string;
    rateLimit: {
      windowMs: number;
      max: number;
    };
    timeout: number;
  };
  puzzle: {
    recommendationBatchSize: number;
    ratingUpdateThreshold: number;
    calibrationInterval: number;
  };
}

const development: Config = {
  database: {
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  server: {
    port: Number(process.env.PORT) || 5000,
    host: "0.0.0.0",
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    timeout: 30000,
  },
  puzzle: {
    recommendationBatchSize: 5,
    ratingUpdateThreshold: 5,
    calibrationInterval: 24 * 60 * 60 * 1000,
  },
};

const production: Config = {
  ...development,
  database: {
    maxConnections: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
    url: process.env.DATABASE_URL
  },
  server: {
    ...development.server,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 300,
    },
  },
};

const test: Config = {
  ...development,
  database: {
    maxConnections: 5,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 1000,
  },
  server: {
    ...development.server,
    port: 5000,
  },
};

const config = process.env.NODE_ENV === 'production' ? production :
               process.env.NODE_ENV === 'test' ? test :
               development;

export default config;
