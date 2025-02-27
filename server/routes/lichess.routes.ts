import { Router } from 'express';
import { ChessApiService } from '../services/chess-api';

const router = Router();

router.post("/import-puzzles", async (req, res) => {
  // Import puzzles logic
});

router.post("/create-study", async (req, res) => {
  // Create study logic
});

export default router;
