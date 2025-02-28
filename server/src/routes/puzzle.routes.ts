import express from 'express';
import { isAuthenticated } from '../auth';
import {
  getRandomPuzzle,
  getPuzzleById,
  recordPuzzleAttempt,
  getPuzzleLeaderboard,
  getUserPuzzleHistory,
  getPuzzleRatingHistory,
  updatePuzzleRating,
  incrementPuzzlesSolved
} from '../storage';

const router = express.Router();

// Get a random puzzle
router.get('/random', async (req, res) => {
  try {
    let minRating: number | undefined;
    let maxRating: number | undefined;
    
    if (req.query.minRating) {
      minRating = parseInt(req.query.minRating as string);
    }
    
    if (req.query.maxRating) {
      maxRating = parseInt(req.query.maxRating as string);
    }
    
    const puzzle = await getRandomPuzzle(minRating, maxRating);
    
    if (!puzzle) {
      return res.status(404).json({ message: 'No puzzles found with the specified criteria' });
    }
    
    res.status(200).json(puzzle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get a specific puzzle by ID
router.get('/:id', async (req, res) => {
  try {
    const puzzleId = parseInt(req.params.id);
    const puzzle = await getPuzzleById(puzzleId);
    
    if (!puzzle) {
      return res.status(404).json({ message: 'Puzzle not found' });
    }
    
    res.status(200).json(puzzle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Record a puzzle attempt
router.post('/:id/attempt', isAuthenticated, async (req, res) => {
  try {
    const puzzleId = parseInt(req.params.id);
    const { solved, timeSpent, ratingChange } = req.body;
    const userId = (req.user as any).id;
    
    if (solved === undefined || timeSpent === undefined || ratingChange === undefined) {
      return res.status(400).json({ message: 'Missing required fields: solved, timeSpent, or ratingChange' });
    }
    
    await recordPuzzleAttempt(userId, puzzleId, solved, timeSpent, ratingChange);
    
    if (solved) {
      await incrementPuzzlesSolved(userId);
      await updatePuzzleRating(userId, (req.user as any).puzzleRating + ratingChange);
    }
    
    res.status(200).json({ message: 'Puzzle attempt recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get puzzle leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const leaderboard = await getPuzzleLeaderboard(limit);
    
    // Remove sensitive information
    const cleanLeaderboard = leaderboard.map(user => {
      const { passwordHash, email, ...userProfile } = user;
      return userProfile;
    });
    
    res.status(200).json(cleanLeaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get user's puzzle history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const history = await getUserPuzzleHistory(userId, limit);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get user's puzzle rating history
router.get('/user/:userId/rating-history', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    
    const ratingHistory = await getPuzzleRatingHistory(userId, limit);
    res.status(200).json(ratingHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
