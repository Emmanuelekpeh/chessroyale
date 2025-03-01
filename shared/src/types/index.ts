export interface User {
  id?: number;
  username: string;
  passwordHash: string;  // Add this line
  email: string;         // Add this line
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
  difficulty: string;
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
  type: string;
  requiredValue: number;
  pointReward: number;
}
