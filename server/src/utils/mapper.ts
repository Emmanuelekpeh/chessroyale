import { User, Puzzle, Game } from "@shared/types/database";

// Maps from database row (snake_case) to application object (camelCase)
export function mapUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    passwordHash: dbUser.password_hash,
    email: dbUser.email,
    rating: dbUser.rating,
    gamesPlayed: dbUser.games_played,
    gamesWon: dbUser.games_won,
    puzzlesSolved: dbUser.puzzles_solved,
    score: dbUser.score,
    currentStreak: dbUser.current_streak,
    bestStreak: dbUser.best_streak,
    totalPoints: dbUser.total_points,
    level: dbUser.level,
    isGuest: dbUser.is_guest,
    puzzleRating: dbUser.puzzle_rating,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
}

// Maps from application object (camelCase) to database parameters (snake_case)
export function mapUserToDb(user: Partial<User>): Record<string, any> {
  const result: Record<string, any> = {};
  
  if ('id' in user) result.id = user.id;
  if ('username' in user) result.username = user.username;
  if ('passwordHash' in user) result.password_hash = user.passwordHash;
  if ('email' in user) result.email = user.email;
  if ('rating' in user) result.rating = user.rating;
  if ('gamesPlayed' in user) result.games_played = user.gamesPlayed;
  if ('gamesWon' in user) result.games_won = user.gamesWon;
  if ('puzzlesSolved' in user) result.puzzles_solved = user.puzzlesSolved;
  if ('score' in user) result.score = user.score;
  if ('currentStreak' in user) result.current_streak = user.currentStreak;
  if ('bestStreak' in user) result.best_streak = user.bestStreak;
  if ('totalPoints' in user) result.total_points = user.totalPoints;
  if ('level' in user) result.level = user.level;
  if ('isGuest' in user) result.is_guest = user.isGuest;
  if ('puzzleRating' in user) result.puzzle_rating = user.puzzleRating;
  
  return result;
}

// Add similar mappers for Puzzle, Game, etc.
