import express from 'express';
import { 
  getUserById, getLeaderboard, getPuzzleLeaderboard,
  getUserGames, getUserPuzzleHistory, getPuzzleRatingHistory
} from '../storage';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive fields
    const { password_hash, ...publicUser } = user;
    res.json({ user: publicUser });
  } catch (error) {
    next(error);
  }
});

// Get user games
router.get('/:id/games', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 10;
    
    const games = await getUserGames(userId, limit);
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Get user's puzzle history
router.get('/:id/puzzles', isAuthenticated, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is requesting their own data
    if ((req.user as any).id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const limit = parseInt(req.query.limit as string) || 10;
    const puzzleHistory = await getUserPuzzleHistory(userId, limit);
    res.json({ puzzleHistory });
  } catch (error) {
    next(error);
  }
});

// Get user's puzzle rating history
router.get('/:id/puzzle-ratings', isAuthenticated, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is requesting their own data
    if ((req.user as any).id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const limit = parseInt(req.query.limit as string) || 30;
    const ratingHistory = await getPuzzleRatingHistory(userId, limit);
    res.json({ ratingHistory });
  } catch (error) {
    next(error);
  }
});

// Get leaderboard
router.get('/leaderboard/rating', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await getLeaderboard(limit);
    
    // Remove sensitive information from users
    const publicLeaderboard = leaderboard.map(user => {
      const { password_hash, email, ...publicUser } = user;
      return publicUser;
    });
    
    res.json({ leaderboard: publicLeaderboard });
  } catch (error) {
    next(error);
  }
});

// Get puzzle leaderboard
router.get('/leaderboard/puzzles', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await getPuzzleLeaderboard(limit);
    
    // Remove sensitive information from users
    const publicLeaderboard = leaderboard.map(user => {
      const { password_hash, email, ...publicUser } = user;
      return publicUser;
    });
    
    res.json({ leaderboard: publicLeaderboard });
  } catch (error) {
    next(error);
  }
});

export default router;
