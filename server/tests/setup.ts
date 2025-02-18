import { db } from '../db';
import { sql } from 'drizzle-orm';

beforeAll(async () => {
  // Ensure database connection
  console.log('Setting up test database connection...');
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // No need to explicitly close the connection with Neon Serverless driver
  console.log('Test suite completed');
});