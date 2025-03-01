import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { 
  getPuzzleById, getRandomPuzzle, createPuzzle, 
  recordPuzzleAttempt, incrementPuzzlesSolved, 
  updatePuzzleRating 
} from '../storage';

const router = express.Router();

// Get puzzle by ID
router.get('/:id', async (req, res, next) => {
  try {
    const puzzleId = parseInt(req.params.id);
    const puzzle = await getPuzzleById(puzzleId);
    
    if (!puzzle) {
      return res.status(404).json({ message: 'Puzzle not found' });
    }
    
    res.json({ puzzle });
  } catch (error) {
    next(error);
  }
});

// Get random puzzle
router.get('/random', async (req, res, next) => {
  try {
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
    const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;
    
    const puzzle = await getRandomPuzzle(minRating, maxRating);
    
    if (!puzzle) {
      return res.status(404).json({ message: 'No puzzles found with given criteria' });
    }
    
    res.json({ puzzle });
  } catch (error) {
    next(error);
  }
});

// Create a new puzzle
router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const userId = (req.user as any).id;
    const puzzleData = {
      ...req.body,
      creator_id: userId
    };
    
    const puzzle = await createPuzzle(puzzleData);
    res.status(201).json({ puzzle });
  } catch (error) {
    next(error);
  }
});

// Submit puzzle solution
router.post('/:id/attempt', isAuthenticated, async (req, res, next) => {
  try {
    const puzzleId = parseInt(req.params.id);
    const userId = (req.user as any).id;
    const { solved, timeSpent, ratingChange } = req.body;
    
    await recordPuzzleAttempt(userId, puzzleId, solved, timeSpent, ratingChange);
    
    if (solved) {
      await incrementPuzzlesSolved(userId);
      await updatePuzzleRating(userId, (req.user as any).puzzle_rating + ratingChange);
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
