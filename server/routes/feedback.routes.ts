import { Router } from 'express';
import { storage } from '../storage';
import { validateRequest } from '../middleware/validation';

const router = Router();

interface FeedbackData {
  puzzleId: number;
  userId: number;
  rating: 1 | 2 | 3 | 4 | 5;
  difficulty: 'too_easy' | 'appropriate' | 'too_hard';
  comments?: string;
}

router.post('/feedback', validateRequest<FeedbackData>(), async (req, res) => {
  try {
    const feedback = await storage.createFeedback({
      ...req.body,
      timestamp: new Date()
    });

    // Update puzzle statistics
    await storage.updatePuzzleStats(req.body.puzzleId, feedback);

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
