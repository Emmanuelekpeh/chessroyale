// This uses camelCase to match your application code
export interface User {
  id: number;
  username: string;
  passwordHash: string; // Changed from password_hash
  email: string | null;
  rating: number;
  gamesPlayed: number; // Changed from games_played
  gamesWon: number; // Changed from games_won
  puzzlesSolved: number; // Changed from puzzles_solved
  score: number;
  currentStreak: number; // Changed from current_streak
  bestStreak: number; // Changed from best_streak
  totalPoints: number; // Changed from total_points
  level: number;
  isGuest: boolean; // Changed from is_guest
  puzzleRating: number; // Changed from puzzle_rating
  createdAt: Date; // Changed from created_at
  updatedAt: Date; // Changed from updated_at
}

export interface Puzzle {
  id: number;
  creatorId: number; // Changed from creator_id
  fen: string;
  solution: string;
  title: string;
  description: string;
  rating: number;
  tacticalTheme: string[]; // Changed from tactical_theme
  difficulty: string;
  verified: boolean;
  hintsAvailable: number; // Changed from hints_available
  pointValue: number; // Changed from point_value
  totalAttempts: number; // Changed from total_attempts
  successfulAttempts: number; // Changed from successful_attempts
  averageTimeToSolve: number; // Changed from average_time_to_solve
  attempts: number;
  solved: number;
}

export interface Game {
  id: string;
  fen: string;
  whitePlayer: number | null; // Changed from white_player
  blackPlayer: number | null; // Changed from black_player
  timeControlInitial: number; // Changed from time_control_initial
  timeControlIncrement: number; // Changed from time_control_increment
  moves: string[];
  status: string;
  winner: string | null;
  startedAt: number; // Changed from started_at
  createdAt: Date; // Changed from created_at
  updatedAt: Date; // Changed from updated_at
}

export interface PuzzleRatingHistory {
  id: number;
  userId: number; // Changed from user_id
  rating: number;
  timestamp: Date;
}

export interface UserPuzzleHistory {
  id: number;
  userId: number; // Changed from user_id
  puzzleId: number; // Changed from puzzle_id
  solved: boolean;
  timeSpent: number; // Changed from time_spent
  ratingChange: number; // Changed from rating_change
  solvedAt: Date; // Changed from solved_at
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  requiredValue: number; // Changed from required_value
  pointReward: number; // Changed from point_reward
}

export interface UserAchievement {
  id: number;
  userId: number; // Changed from user_id
  achievementId: number; // Changed from achievement_id
  earnedAt: Date; // Changed from earned_at
}

export interface GameChat {
  id: number;
  gameId: string; // Changed from game_id
  userId: number; // Changed from user_id
  message: string;
  sentAt: Date; // Changed from sent_at
}

export interface Rating {
  id: number;
  userId: number; // Changed from user_id
  rating: number;
  timestamp: Date;
}

export interface FriendRequest {
  id: number;
  senderId: number; // Changed from sender_id
  receiverId: number; // Changed from receiver_id
  status: string;
  sentAt: Date; // Changed from sent_at
  updatedAt: Date; // Changed from updated_at
}

export interface UserSettings {
  id: number;
  userId: number; // Changed from user_id
  theme: string;
  sound: boolean;
  notifications: boolean;
  boardStyle: string; // Changed from board_style
  pieceStyle: string; // Changed from piece_style
  updatedAt: Date; // Changed from updated_at
}

// Additional interfaces for potential future use

export interface Tournament {
  id: number;
  name: string;
  description: string;
  startTime: Date; // Changed from start_time
  endTime: Date; // Changed from end_time
  format: string;
  timeControl: number; // Changed from time_control
  minRating: number | null; // Changed from min_rating
  maxRating: number | null; // Changed from max_rating
  maxParticipants: number; // Changed from max_participants
  creatorId: number; // Changed from creator_id
  status: string;
  createdAt: Date; // Changed from created_at
  updatedAt: Date; // Changed from updated_at
}

export interface TournamentParticipant {
  id: number;
  tournamentId: number; // Changed from tournament_id
  userId: number; // Changed from user_id
  score: number;
  rank: number | null;
  joinedAt: Date; // Changed from joined_at
}
