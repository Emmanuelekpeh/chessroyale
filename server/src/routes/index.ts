import { Express } from 'express';
import userRoutes from './user.routes';
import puzzleRoutes from './puzzle.routes';
import lichessRoutes from './lichess.routes';
import { requireAuth } from "../middleware/auth";

export function registerRoutes(app: Express) {
  app.use('/api/users', userRoutes);
  app.use('/api/puzzles', puzzleRoutes);
  app.use('/api/lichess', lichessRoutes);
}
