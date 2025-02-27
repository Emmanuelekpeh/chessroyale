export interface User {
  id?: number;
  username: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  score: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  level: number;
  isGuest: boolean;
}

export interface Puzzle {
  id?: number;
  creatorId: number;
  fen: string;
  solution: string;
  title: string;
  description: string;
  rating: number;
  tacticalTheme: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  verified: boolean;
  hintsAvailable: number;
  pointValue: number;
  totalAttempts: number;
  successfulAttempts: number;
  averageTimeToSolve: number;
}

export interface Achievement {
  id?: number;
  name: string;
  description: string;
  type: 'puzzles_solved' | 'rating' | 'streak' | 'total_points';
  requiredValue: number;
  pointReward: number;
}
