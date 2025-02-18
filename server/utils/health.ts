import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const healthRouter = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: boolean;
    api: boolean;
    storage: boolean;
  };
  uptime: number;
}

healthRouter.get('/health', async (req, res) => {
  try {
    // Use absolute path to the binary
    const binaryPath = path.join(__dirname, '../../target/release/health_monitor');
    const healthCheck = spawn(binaryPath);
    let output = '';
    let errorOutput = '';

    healthCheck.stdout.on('data', (data) => {
      output += data.toString();
    });

    healthCheck.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Health check error:', data.toString());
    });

    healthCheck.on('close', (code) => {
      if (code !== 0) {
        console.error('Health check failed:', errorOutput);
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        });
        return;
      }

      try {
        const healthStatus: HealthStatus = JSON.parse(output);
        res.json(healthStatus);
      } catch (error) {
        console.error('Failed to parse health check output:', error);
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Invalid health check response',
        });
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
});

export default healthRouter;