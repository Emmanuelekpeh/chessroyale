import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import config from '../../config';
import { logger } from '../utils/logger';  // Add this import

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis
});

// Add this connection event
pool.on('connect', () => {
  logger.info('New database connection established');  // Using your logger instead of console.info
});

// Replace your existing error handler with this one
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);  // Using your logger instead of console.error
  process.exit(-1);
});

export const db = drizzle(pool);
