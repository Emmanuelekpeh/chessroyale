-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  rating INTEGER NOT NULL DEFAULT 1200,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  puzzles_solved INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  puzzle_rating INTEGER NOT NULL DEFAULT 1200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  fen TEXT NOT NULL,
  solution TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rating INTEGER NOT NULL,
  tactical_theme TEXT[] NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  hints_available INTEGER NOT NULL,
  point_value INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  successful_attempts INTEGER NOT NULL DEFAULT 0,
  average_time_to_solve INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  solved INTEGER NOT NULL DEFAULT 0
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(36) PRIMARY KEY,
  fen TEXT NOT NULL,
  white_player INTEGER REFERENCES users(id),
  black_player INTEGER REFERENCES users(id),
  time_control_initial INTEGER NOT NULL,
  time_control_increment INTEGER NOT NULL,
  moves TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL,
  winner VARCHAR(20),
  started_at INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  required_value INTEGER NOT NULL,
  point_reward INTEGER NOT NULL
);

-- PuzzleRatingHistory table
CREATE TABLE IF NOT EXISTS puzzle_rating_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- UserPuzzleHistory table
CREATE TABLE IF NOT EXISTS user_puzzle_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  puzzle_id INTEGER NOT NULL REFERENCES puzzles(id),
  solved BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  solved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player);
CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player);
CREATE INDEX IF NOT EXISTS idx_user_puzzle_history_user_id ON user_puzzle_history(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_rating_history_user_id ON puzzle_rating_history(user_id);
