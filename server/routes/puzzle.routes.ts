import { Router } from 'express';
import { storage } from '../storage';
import { validateRequest } from '../middleware/validation';
import { insertPuzzleSchema } from '../../shared/schema';
import { PuzzleGenerator } from '../services/puzzle-generator';
import { PuzzleRecommender } from '../services/puzzle-recommender';

const router = Router();
const puzzleRecommender = new PuzzleRecommender();

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
    const status = err.status || 500;
    const message = err.message || 'Failed to fetch puzzles';
    res.status(status).json({
      error: {
        message,
        code: err.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const puzzleId = parseInt(req.params.id);
    if (isNaN(puzzleId)) {
      return res.status(400).json({ error: "Invalid puzzle ID" });
    }

    const puzzle = await storage.getPuzzle(puzzleId);
    if (!puzzle) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    res.json(puzzle);
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    res.status(500).json({ error: 'Failed to fetch puzzle' });
  }
});

// ... Add other puzzle routes (verify, calibrate, metrics, rating-history, etc.)

router.post("/generate", async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    const generator = new PuzzleGenerator();

    await generator.generateBatch(count);
    generator.cleanup();

    res.json({ message: `Started generating ${count} puzzles` });
  } catch (error) {
    console.error('Error initiating puzzle generation:', error);
    res.status(500).json({ error: 'Failed to generate puzzles' });
  }
});

router.get("/personalized-recommendations", async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 5;
    const user = await storage.getUser(req.body.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const puzzleHistory = await storage.getUserPuzzleHistory(user.id);
    const completedPuzzles = await Promise.all(
      puzzleHistory.map(async history => ({
        ...(await storage.getPuzzle(history.puzzleId))!,
        history,
      }))
    );

    const availablePuzzles = await storage.getPuzzles(true);

    const recommendations = await puzzleRecommender.generateRecommendations(
      user,
      completedPuzzles.filter(Boolean) as any[],
      availablePuzzles,
      count
    );

    await storage.updateUserStats(user.id, {
      lastRecommendationAt: new Date(),
      recommendationCount: (user.recommendationCount || 0) + 1
    });

    res.json({
      ...recommendations,
      userProgress: {
        rating: user.rating,
        puzzlesSolved: user.puzzlesSolved,
        currentStreak: user.currentStreak,
        level: user.level
      }
    });
  } catch (error) {
    console.error('Error generating puzzle recommendations:', error);
    res.status(500).json({ error: 'Failed to generate puzzle recommendations' });
  }
});

export default router;
