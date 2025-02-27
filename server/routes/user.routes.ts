import { Router } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '../../shared/schema';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post("/", validateRequest(insertUserSchema), async (req, res) => {
  try {
    console.log("Creating new user with data:", req.body);
    const user = await storage.createUser({
      ...req.body,
      rating: 1200,
      gamesPlayed: 0,
      gamesWon: 0,
      puzzlesSolved: 0,
      score: 0
    });

    console.log("Created user:", user);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/:id/puzzle-history", async (req, res) => {
  try {
    const history = await storage.getUserPuzzleHistory(Number(req.params.id));
    res.json(history);
  } catch (error) {
    console.error('Error fetching puzzle history:', error);
    res.status(500).json({ error: 'Failed to fetch puzzle history' });
  }
});

export default router;
