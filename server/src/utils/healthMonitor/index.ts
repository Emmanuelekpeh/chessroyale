import { db } from "../../db";
import { sql } from "drizzle-orm";

export interface HealthStatus {
  status: 'ok' | 'error';
  database: boolean;
  uptime: number;
  timestamp: string;
  message?: string;
}

let startTime = Date.now();

export const checkHealth = async (): Promise<HealthStatus> => {
  try {
    // Check database connection
    const dbCheck = await db.execute(sql`SELECT 1`);
    const dbStatus = !!dbCheck;
    
    return {
      status: dbStatus ? 'ok' : 'error',
      database: dbStatus,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      database: false,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      message: (error as Error).message
    };
  }
};

export const resetUptime = () => {
  startTime = Date.now();
};
