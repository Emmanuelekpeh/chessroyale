import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { nanoid } from 'nanoid';
import { logger } from './utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add proper types
interface DevServerOptions {
  root?: string;
  base?: string;
  configFile?: string;
}

export async function createDevServer(options: DevServerOptions = {}) {
  const {
    root = process.cwd(),
    base = '/',
    configFile = '../vite.config.ts'
  } = options;

  const resolve = (p: string) => path.resolve(__dirname, p);

  const manifest = {};
  const vite = await createViteServer({
    root,
    base,
    configFile,
    server: {
      middlewareMode: true,
      watch: {
        usePolling: true,
        interval: 100
      }
    },
    appType: 'custom'
  });

  const requestId = () => nanoid();

  // Log middleware
  const logMiddleware = (msg: string, options?: any) => {
    const id = requestId();
    logger.info(`[${id}] ${msg}`, options);
    return id;
  };

  // Error handler middleware
  const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Server error:', err);
    res.status(500).send('Internal Server Error');
  };

  // Development middleware
  const devMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    const id = logMiddleware(`${req.method} ${url}`);

    try {
      // Serve static assets
      const publicFile = resolve(`../client/public${url}`);
      if (fs.existsSync(publicFile)) {
        return res.sendFile(publicFile);
      }

      // Transform index.html
      let template = fs.readFileSync(
        resolve('../client/index.html'),
        'utf-8'
      );
      template = await vite.transformIndexHtml(url, template);

      // Apply Vite HTML transforms
      const html = await vite.transformIndexHtml(url, template);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      logMiddleware(`Request completed`, { id, status: 200 });
    } catch (e) {
      const error = e as Error;
      logger.error(`Error processing request: ${error.message}`, error);
      vite.ssrFixStacktrace(error);
      next(error);
    }
  };

  // Health check endpoint
  const healthCheck = (_req: Request, res: Response) => {
    res.json({ status: 'healthy' });
  };

  return {
    vite,
    devMiddleware,
    errorHandler,
    healthCheck
  };
} 