import { Router } from 'express';
import { storage } from '../storage';
import { ChessApiService } from '../services/chess-api';

const router = Router();
const chessApiService = new ChessApiService();

router.post("/import-puzzles", async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    const puzzles = await chessApiService.importPuzzlesFromLichess(count);

    // Save imported puzzles to our database
    for (const puzzle of puzzles) {
      await storage.createPuzzle({
        title: puzzle.isDaily ? "Daily Lichess Puzzle" : "Lichess Puzzle",
        description: `Imported from Lichess. Themes: ${puzzle.themes.join(", ")}`,
        fen: puzzle.fen,
        solution: puzzle.solution,
        rating: puzzle.rating,
        difficulty: puzzle.rating < 1500 ? "beginner" :
                   puzzle.rating < 2000 ? "intermediate" : "advanced",
        tacticalTheme: puzzle.themes,
        creatorId: req.body.creatorId,
        verified: true,
      });
    }

    res.json(puzzles);
  } catch (error: unknown) {
    console.error('Error importing Lichess puzzles:', error);
    res.status(500).json({ error: 'Failed to import Lichess puzzles' });
  }
});

router.post("/create-study", async (req, res) => {
  try {
    const { title, puzzleIds } = req.body;

    const puzzles = await Promise.all(
      puzzleIds.map((id: number) => storage.getPuzzle(id))
    );

    const study = await chessApiService.createStudyFromPuzzles(
      title,
      puzzles.filter(Boolean).map(puzzle => ({
        fen: puzzle.fen,
        solution: puzzle.solution
      }))
    );

    res.json(study);
  } catch (error) {
    console.error('Error creating Lichess study:', error);
    res.status(500).json({ error: 'Failed to create Lichess study' });
  }
});

export default router;
