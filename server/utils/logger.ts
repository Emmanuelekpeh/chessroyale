import { createWriteStream } from 'fs';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

class Logger {
  private static instance: Logger;
  private logStream: NodeJS.WritableStream;
  private errorStream: NodeJS.WritableStream;

  private constructor() {
    const logDir = join(process.cwd(), 'logs');

    // Create logs directory if it doesn't exist
    if (!existsSync(logDir)) {
      try {
        mkdirSync(logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create logs directory:', error);
        // Fallback to console-only logging
        this.logStream = process.stdout;
        this.errorStream = process.stderr;
        return;
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];

    try {
      this.logStream = createWriteStream(
        join(logDir, `app-${timestamp}.log`),
        { flags: 'a' }
      );

      this.errorStream = createWriteStream(
        join(logDir, `error-${timestamp}.log`),
        { flags: 'a' }
      );

      // Handle stream errors
      this.logStream.on('error', (err) => {
        console.error('Error writing to log stream:', err);
        this.logStream = process.stdout;
      });

      this.errorStream.on('error', (err) => {
        console.error('Error writing to error stream:', err);
        this.errorStream = process.stderr;
      });
    } catch (error) {
      console.error('Failed to create log streams:', error);
      // Fallback to console
      this.logStream = process.stdout;
      this.errorStream = process.stderr;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }) + '\n';
  }

  public info(message: string, meta?: any): void {
    const formatted = this.formatMessage('INFO', message, meta);
    this.logStream.write(formatted);
    console.log(formatted);
  }

  public error(message: string, error?: Error, meta?: any): void {
    const formatted = this.formatMessage('ERROR', message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
    this.errorStream.write(formatted);
    console.error(formatted);
  }

  public warn(message: string, meta?: any): void {
    const formatted = this.formatMessage('WARN', message, meta);
    this.logStream.write(formatted);
    console.warn(formatted);
  }

  public debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.formatMessage('DEBUG', message, meta);
      this.logStream.write(formatted);
      console.debug(formatted);
    }
  }
}

// Export the singleton instance
export const logger = Logger.getInstance();