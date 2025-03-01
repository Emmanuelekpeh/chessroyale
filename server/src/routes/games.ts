import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '../middleware/auth';
import { createGame, getGameById, updateGame } from '../storage';

const router = express.Router();

// Create a new game
router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const { whiteId, blackId, timeControl, increment, rated } = req.body;
    const userId = (req.user as any).id;
    
    // Validate that user is part of the game
    if (whiteId !== userId && blackId !== userId) {
      return res.status(403).json({ message: 'You must be a player in the game' });
    }
    
    const gameData = {
      id: uuidv4(),
      whiteId: whiteId ? parseInt(whiteId) : null,
      blackId: blackId ? parseInt(blackId) : null,
      timeControlInitial: timeControl || 600, // Default 10 minutes
      timeControlIncrement: increment || 0,
      rated: rated === true
    };
    
    const game = await createGame(gameData);
    res.status(201).json({ game });
  } catch (error) {
    next(error);
  }
});

// Get game by ID
router.get('/:id', async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Update game state
router.patch('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const gameId = req.params.id;
    const game = await getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user is a player in this game
    const userId = (req.user as any).id;
    if (game.white_player !== userId && game.black_player !== userId) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    const updateData = req.body;
    // Prevent updating critical fields
    delete updateData.id;
    delete updateData.white_player;
    delete updateData.black_player;
    
    const updatedGame = await updateGame(gameId, updateData);
    res.json({ game: updatedGame });
  } catch (error) {
    next(error);
  }
});

export default router;
