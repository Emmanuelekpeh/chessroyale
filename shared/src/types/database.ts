export interface User {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  rating: number;
  games_played: number;
  games_won: number;
  puzzles_solved: number;
  score: number;
  current_streak: number;
  best_streak: number;
  total_points: number;
  level: number;
  is_guest: boolean;
  puzzle_rating: number;
  created_at: Date;
  updated_at: Date;
}

export interface Puzzle {
  id: number;
  creator_id: number;
  fen: string;
  solution: string;
  title: string;
  description: string;
  rating: number;
  tactical_theme: string[];
  difficulty: string;
  verified: boolean;
  hints_available: number;
  point_value: number;
  total_attempts: number;
  successful_attempts: number;
  average_time_to_solve: number;
  attempts: number;
  solved: number;
}

export interface Game {
  id: string;
  fen: string;
  white_player: number | null;
  black_player: number | null;
  time_control_initial: number;
  time_control_increment: number;
  moves: string[];
  status: string;
  winner: string | null;
  started_at: number;
  created_at: Date;
  updated_at: Date;
}

export interface PuzzleRatingHistory {
  id: number;
  user_id: number;
  rating: number;
  timestamp: Date;
}

export interface UserPuzzleHistory {
  id: number;
  user_id: number;
  puzzle_id: number;
  solved: boolean;
  time_spent: number;
  rating_change: number;
  solved_at: Date;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  required_value: number;
  point_reward: number;
}
