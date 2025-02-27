import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3).max(30),
  rating: z.number().min(0).default(1200),
  gamesPlayed: z.number().min(0).default(0),
  gamesWon: z.number().min(0).default(0),
  puzzlesSolved: z.number().min(0).default(0),
  score: z.number().min(0).default(0),
  currentStreak: z.number().min(0).default(0),
  bestStreak: z.number().min(0).default(0),
  totalPoints: z.number().min(0).default(0),
  level: z.number().min(0).default(1),
  isGuest: z.boolean().default(false)
});

export const puzzleSchema = z.object({
  id: z.number().optional(),
  creatorId: z.number(),
  fen: z.string(),
  solution: z.string(),
  title: z.string(),
  description: z.string(),
  rating: z.number().min(0),
  tacticalTheme: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  verified: z.boolean(),
  hintsAvailable: z.number().min(0),
  pointValue: z.number().min(0),
  totalAttempts: z.number().min(0),
  successfulAttempts: z.number().min(0),
  averageTimeToSolve: z.number().min(0)
});
