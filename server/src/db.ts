import { query, queryOne, transaction } from "./db";
import { 
  User, Puzzle, Game, PuzzleRatingHistory, 
  UserPuzzleHistory, Achievement 
} from "@shared/types/database";

// User operations
export async function createUser(username: string, passwordHash: string, email?: string): Promise<User> {
  const result = await query(
    `INSERT INTO users 
     (username, password_hash, email, rating, puzzle_rating, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [username, passwordHash, email, 1200, 1200, new Date(), new Date()]
  );
  return result.rows[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  return await queryOne('SELECT * FROM users WHERE username = $1', [username]);
}

export async function getUserById(id: number): Promise<User | undefined> {
  return await queryOne('SELECT * FROM users WHERE id = $1', [id]);
}

export async function updateUserLastSeen(userId: number): Promise<void> {
  await query(
    'UPDATE users SET updated_at = $1 WHERE id = $2',
    [new Date(), userId]
  );
}

export async function updateUserRating(userId: number, newRating: number): Promise<void> {
  await query(
    'UPDATE users SET rating = $1, updated_at = $2 WHERE id = $3',
    [newRating, new Date(), userId]
  );
}

export async function incrementUserGameStats(userId: number, won: boolean): Promise<void> {
  await query(
    `UPDATE users
     SET games_played = games_played + 1,
         games_won = games_won + CASE WHEN $1 THEN 1 ELSE 0 END,
         updated_at = $2
     WHERE id = $3`,
    [won, new Date(), userId]
  );
}

export async function updatePuzzleRating(userId: number, newRating: number): Promise<void> {
  await query(
    'UPDATE users SET puzzle_rating = $1, updated_at = $2 WHERE id = $3',
    [newRating, new Date(), userId]
  );
}

export async function incrementPuzzlesSolved(userId: number): Promise<void> {
  await query(
    'UPDATE users SET puzzles_solved = puzzles_solved + 1, updated_at = $1 WHERE id = $2',
    [new Date(), userId]
  );
}

export async function getLeaderboard(limit = 10): Promise<User[]> {
  const result = await query(
    'SELECT * FROM users ORDER BY rating DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

export async function getPuzzleLeaderboard(limit = 10): Promise<User[]> {
  const result = await query(
    'SELECT * FROM users ORDER BY puzzle_rating DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

// Puzzle operations
export async function getPuzzleById(id: number): Promise<Puzzle | undefined> {
  return await queryOne('SELECT * FROM puzzles WHERE id = $1', [id]);
}

export async function getRandomPuzzle(minRating?: number, maxRating?: number): Promise<Puzzle | undefined> {
  let sql = 'SELECT * FROM puzzles';
  const params: any[] = [];
  
  if (minRating !== undefined && maxRating !== undefined) {
    sql += ' WHERE rating >= $1 AND rating <= $2';
    params.push(minRating, maxRating);
  }
  
  sql += ' ORDER BY RANDOM() LIMIT 1';
  return await queryOne(sql, params);
}

export async function createPuzzle(puzzle: Omit<Puzzle, 'id'>): Promise<Puzzle> {
  const keys = Object.keys(puzzle);
  const values = Object.values(puzzle);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');
  
  const result = await query(
    `INSERT INTO puzzles (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  
  return result.rows[0];
}

export async function recordPuzzleAttempt(
  userId: number,
  puzzleId: number,
  solved: boolean,
  timeSpent: number,
  ratingChange: number
): Promise<void> {
  await transaction(async (client) => {
    // Record attempt in user_puzzle_history
    await client.query(
      `INSERT INTO user_puzzle_history
       (user_id, puzzle_id, solved, time_spent, rating_change, solved_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, puzzleId, solved, timeSpent, ratingChange, new Date()]
    );
    
    // Get user for puzzle rating update
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    if (user) {
      // Record puzzle rating history
      await client.query(
        `INSERT INTO puzzle_rating_history
         (user_id, rating, timestamp)
         VALUES ($1, $2, $3)`,
        [userId, user.puzzle_rating + ratingChange, new Date()]
      );
    }
    
    // Update puzzle stats
    const puzzleResult = await client.query(
      'SELECT * FROM puzzles WHERE id = $1',
      [puzzleId]
    );
    const puzzle = puzzleResult.rows[0];
    
    if (puzzle) {
      const totalAttempts = puzzle.attempts + 1;
      const totalSolved = solved ? puzzle.solved + 1 : puzzle.solved;
      const avgTime = puzzle.average_time_to_solve 
        ? (puzzle.average_time_to_solve * puzzle.solved + timeSpent) / (totalSolved || 1)
        : timeSpent;
        
      await client.query(
        `UPDATE puzzles
         SET total_attempts = total_attempts + 1,
             successful_attempts = successful_attempts + CASE WHEN $1 THEN 1 ELSE 0 END,
             attempts = $2,
             solved = $3,
             average_time_to_solve = $4
         WHERE id = $5`,
        [solved, totalAttempts, totalSolved, avgTime, puzzleId]
      );
    }
  });
}

export async function getUserPuzzleHistory(userId: number, limit = 10): Promise<UserPuzzleHistory[]> {
  const result = await query(
    `SELECT * FROM user_puzzle_history
     WHERE user_id = $1
     ORDER BY solved_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function getPuzzleRatingHistory(userId: number, limit = 30): Promise<PuzzleRatingHistory[]> {
  const result = await query(
    `SELECT * FROM puzzle_rating_history
     WHERE user_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

// Game operations
export async function getGameById(gameId: string): Promise<Game | undefined> {
  return await queryOne('SELECT * FROM games WHERE id = $1', [gameId]);
}

export async function createGame(gameData: {
  id: string;
  whiteId: number | null;
  blackId: number | null;
  timeControlInitial: number;
  timeControlIncrement: number;
  rated: boolean;
}): Promise<Game> {
  const result = await query(
    `INSERT INTO games
     (id, white_player, black_player, fen, time_control_initial, time_control_increment, moves, status, created_at, updated_at, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      gameData.id, 
      gameData.whiteId, 
      gameData.blackId,
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
      gameData.timeControlInitial,
      gameData.timeControlIncrement,
      [], // Empty moves array
      'created',
      new Date(),
      new Date(),
      Math.floor(Date.now() / 1000) // Current timestamp in seconds
    ]
  );
  return result.rows[0];
}

export async function updateGame(gameId: string, updateData: Partial<Game>): Promise<Game | undefined> {
  // Build dynamic SQL update based on the fields provided
  const keys = Object.keys(updateData).filter(key => key !== 'id');
  if (keys.length === 0) return await getGameById(gameId);
  
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const values = keys.map(key => updateData[key as keyof Partial<Game>]);
  
  await query(
    `UPDATE games
     SET ${setClause}, updated_at = $1
     WHERE id = $${keys.length + 2}`,
    [new Date(), ...values, gameId]
  );
  
  return await getGameById(gameId);
}

export async function getUserGames(userId: number, limit = 10): Promise<Game[]> {
  const result = await query(
    `SELECT * FROM games
     WHERE white_player = $1 OR black_player = $1
     ORDER BY updated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function updateUserLastActiveTime(userId: number): Promise<void> {
  await query(
    'UPDATE users SET updated_at = $1 WHERE id = $2',
    [new Date(), userId]
  );
}
