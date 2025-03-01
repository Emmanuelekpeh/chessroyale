import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool that will be reused for all queries
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper for running SQL queries
export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Helper for running a single query and getting the first row
export async function queryOne(text: string, params: any[] = []) {
  const result = await query(text, params);
  return result.rows[0];
}

// Helper for running a transaction
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
