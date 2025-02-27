import { Router } from 'express';
import { storage } from '../storage';
import { insertPuzzleSchema } from '../../shared/schema';
import { validateRequest } from '../middleware/validation';
import { PuzzleGenerator } from '../services/puzzle-generator';
import { PuzzleRecommender } from '../services/puzzle-recommender';

const router = Router();
const puzzleRecommender = new PuzzleRecommender();

// GET /api/puzzles
router.get("/", async (req, res) => {
  try {
    console.log('Fetching puzzles with query params:', req.query);
    const verified = req.query.verified ? req.query.verified === 'true' : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const puzzles = await storage.getPuzzles(verified);
    if (!puzzles || !Array.isArray(puzzles)) {
      throw new Error('Invalid puzzle data received from storage');
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedPuzzles = puzzles.slice(startIndex, startIndex + pageSize);

    console.log(`Found ${paginatedPuzzles.length} puzzles for page ${page}`);
    res.json(paginatedPuzzles);
  } catch (error: unknown) {
    console.error('Error fetching puzzles:', error);
    const err = error as Error & { status?: number; code?: string };
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Failed to fetch puzzles',
        code: err.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
});

// Add all other puzzle routes (GET /:id, POST /, etc.)
// [Previous implementations from routes.ts]

export default router;
