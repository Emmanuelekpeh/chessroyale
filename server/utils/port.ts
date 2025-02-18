import { createServer } from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { logger } from './logger';

interface PortResult {
  port: number;
  success: boolean;
  error?: string;
}

export async function findFreePort(startPort: number = 3000, endPort: number = 65535): Promise<number> {
  const blacklistedPorts = [3000, 8080, 5000, 4000]; // Common development ports
  // Try Node.js implementation first
  try {
    logger.info('Attempting to find free port using Node.js implementation', { startPort, endPort });
    const port = await findPortNode(startPort, endPort, blacklistedPorts);
    logger.info('Successfully found free port using Node.js implementation', { port });
    return port;
  } catch (error) {
    logger.warn('Node.js port finder failed', { error });

    // Skip Rust binary attempt for now since we know it's not built
    logger.info('Skipping Rust binary attempt, using fallback port', { port: startPort });
    return startPort;
  }
}

async function findPortNode(startPort: number, endPort: number, blacklistedPorts: number[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    let currentPort = startPort;

    const tryPort = (port: number) => {
      if (blacklistedPorts.includes(port)) {
        logger.debug('Port blacklisted', { port });
        if (port >= endPort) {
          reject(new Error(`No free port found between ${startPort} and ${endPort}`));
        } else {
          tryPort(port + 1);
        }
        return;
      }
      logger.debug('Trying port', { port });
      server.listen(port, '0.0.0.0', () => {
        server.once('close', () => {
          logger.debug('Found available port', { port });
          resolve(port);
        });
        server.close();
      });

      server.on('error', (err) => {
        logger.debug('Port in use', { port, error: err.message });
        if (port >= endPort) {
          reject(new Error(`No free port found between ${startPort} and ${endPort}`));
        } else {
          tryPort(port + 1);
        }
      });
    };

    tryPort(currentPort);
  });
}

// Keep the Rust implementation but don't use it for now
async function findPortRust(startPort: number, endPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const binaryPath = path.join(__dirname, '../../target/release/port_finder');
    logger.debug('Attempting to use Rust binary', { binaryPath });

    const portFinder = spawn(binaryPath, [startPort.toString(), endPort.toString()]);
    let output = '';
    let errorOutput = '';

    portFinder.stdout.on('data', (data) => {
      output += data.toString();
    });

    portFinder.stderr.on('data', (data) => {
      errorOutput += data.toString();
      logger.error('Port finder error:', { error: data.toString() });
    });

    portFinder.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Port finder failed with code ${code}: ${errorOutput}`));
      }

      try {
        const result: PortResult = JSON.parse(output);
        if (result.success) {
          resolve(result.port);
        } else {
          reject(new Error(result.error || 'Failed to find free port'));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}