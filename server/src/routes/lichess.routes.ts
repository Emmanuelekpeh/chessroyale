import express from 'express';
import { isAuthenticated } from '../auth';
import { createPuzzle } from '../storage';

const router = express.Router();

// Import puzzles from Lichess
router.post('/import-puzzles', isAuthenticated, async (req, res) => {
  try {
    const { puzzles } = req.body;
    
    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      return res.status(400).json({ message: 'No puzzles provided or invalid format' });
    }
    
    const results = [];
    
    for (const puzzleData of puzzles) {
      // Validate puzzle data
      if (!puzzleData.fen || !puzzleData.moves || !puzzleData.rating) {
        continue;
      }
      
      // Create puzzle
      const puzzle = await createPuzzle({
        fen: puzzleData.fen,
        moves: puzzleData.moves,
        rating: puzzleData.rating,
        themes: puzzleData.themes || [],
        gameUrl: puzzleData.gameUrl || null,
        attempts: 0,
        solved: 0,
        averageTimeToSolve: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      results.push(puzzle);
    }
    
    res.status(200).json({ 
      message: `Successfully imported ${results.length} puzzles`,
      puzzles: results 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
