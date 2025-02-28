import express from 'express';
import { isAuthenticated } from '../auth';
import {
  getUserById,
  updateUserRating,
  getLeaderboard,
  getUserGames,
  updateUserLastActiveTime
} from '../storage';

const router = express.Router();

// Get current user profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await getUserById((req.user as any).id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send sensitive data
    const { passwordHash, ...userProfile } = user;
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send sensitive data
    const { passwordHash, email, ...userProfile } = user;
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Update user's last activity time
router.post('/active', isAuthenticated, async (req, res) => {
  try {
    await updateUserLastActiveTime((req.user as any).id);
    res.status(200).json({ message: 'Last active time updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get user's game history
router.get('/:id/games', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const games = await getUserGames(userId, limit);
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const leaderboard = await getLeaderboard(limit);
    
    // Remove sensitive data
    const cleanLeaderboard = leaderboard.map(user => {
      const { passwordHash, email, ...userProfile } = user;
      return userProfile;
    });
    
    res.status(200).json(cleanLeaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
