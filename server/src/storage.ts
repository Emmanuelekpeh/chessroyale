import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { 
  users, puzzles, games, achievements,
  puzzleRatingHistory as puzzleRatingHistoryTable,
  userPuzzleHistory as userPuzzleHistoryTable 
} from "@shared/schema";

// Define insertion types
type User = typeof users.$inferSelect;
type InsertUser = typeof users.$inferInsert;
type Puzzle = typeof puzzles.$inferSelect;
type InsertPuzzle = typeof puzzles.$inferInsert;
type Game = typeof games.$inferSelect;
type UserPuzzleHistory = typeof userPuzzleHistoryTable.$inferSelect;
type InsertUserPuzzleHistory = typeof userPuzzleHistoryTable.$inferInsert;
type PuzzleRatingHistory = typeof puzzleRatingHistoryTable.$inferSelect;

export async function createUser(username: string, passwordHash: string, email?: string) {
  const newUser: InsertUser = {
    username,
    passwordHash,
    email,
    rating: 1200,
    gamesPlayed: 0,
    gamesWon: 0,
    puzzlesSolved: 0,
    puzzleRating: 1200,
    createdAt: new Date(),
    updatedAt: new Date(),
    isGuest: false
  };

  const result = await db.insert(users).values(newUser).returning();
  return result[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function updateUserLastSeen(userId: number) {
  await db
    .update(users)
    .set({
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function updateUserRating(userId: number, newRating: number) {
  await db
    .update(users)
    .set({
      rating: newRating,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function incrementUserGameStats(userId: number, won: boolean) {
  const user = await getUserById(userId);
  if (!user) return;

  await db
    .update(users)
    .set({
      gamesPlayed: user.gamesPlayed + 1,
      gamesWon: won ? user.gamesWon + 1 : user.gamesWon,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function updatePuzzleRating(userId: number, newRating: number) {
  await db
    .update(users)
    .set({
      puzzleRating: newRating,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function incrementPuzzlesSolved(userId: number) {
  const user = await getUserById(userId);
  if (!user) return;

  await db
    .update(users)
    .set({
      puzzlesSolved: user.puzzlesSolved + 1,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function getLeaderboard(limit = 10) {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.rating))
    .limit(limit);
}

export async function getPuzzleLeaderboard(limit = 10) {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.puzzleRating))
    .limit(limit);
}

export async function getPuzzleById(id: number): Promise<Puzzle | undefined> {
  const result = await db.select().from(puzzles).where(eq(puzzles.id, id));
  return result[0];
}

export async function getRandomPuzzle(minRating?: number, maxRating?: number): Promise<Puzzle | undefined> {
  let query = db.select().from(puzzles);
  
  if (minRating && maxRating) {
    query = query.where(
      and(
        sql`${puzzles.rating} >= ${minRating}`,
        sql`${puzzles.rating} <= ${maxRating}`
      )
    );
  }
  
  query = query.orderBy(sql`RANDOM()`).limit(1);
  
  const result = await query;
  return result[0];
}

export async function createPuzzle(puzzle: InsertPuzzle) {
  const result = await db.insert(puzzles).values(puzzle).returning();
  return result[0];
}

export async function recordPuzzleAttempt(
  userId: number,
  puzzleId: number,
  solved: boolean,
  timeSpent: number,
  ratingChange: number
) {
  const history: InsertUserPuzzleHistory = {
    userId,
    puzzleId,
    solved,
    timeSpent,
    ratingChange,
    solvedAt: new Date()
  };

  await db.insert(userPuzzleHistoryTable).values(history);

  // Record the puzzle rating history
  const user = await getUserById(userId);
  if (user) {
    await db.insert(puzzleRatingHistoryTable).values({
      userId,
      rating: user.puzzleRating + ratingChange,
      timestamp: new Date()
    });
  }

  // Update puzzle stats
  const puzzle = await getPuzzleById(puzzleId);
  if (puzzle) {
    const totalAttempts = puzzle.attempts + 1;
    const totalSolved = solved ? puzzle.solved + 1 : puzzle.solved;
    const avgTime = puzzle.averageTimeToSolve 
      ? (puzzle.averageTimeToSolve * puzzle.solved + timeSpent) / (totalSolved || 1)
      : timeSpent;

    await db
      .update(puzzles)
      .set({
        attempts: totalAttempts,
        solved: totalSolved,
        averageTimeToSolve: avgTime
      })
      .where(eq(puzzles.id, puzzleId));
  }
}

export async function getUserPuzzleHistory(userId: number, limit = 10): Promise<UserPuzzleHistory[]> {
  return await db
    .select()
    .from(userPuzzleHistoryTable)
    .where(eq(userPuzzleHistoryTable.userId, userId))
    .orderBy(desc(userPuzzleHistoryTable.solvedAt))
    .limit(limit);
}

export async function getPuzzleRatingHistory(userId: number, limit = 30): Promise<PuzzleRatingHistory[]> {
  return await db
    .select()
    .from(puzzleRatingHistoryTable)
    .where(eq(puzzleRatingHistoryTable.userId, userId))
    .orderBy(desc(puzzleRatingHistoryTable.timestamp))
    .limit(limit);
}

export async function getGameById(gameId: string): Promise<Game | undefined> {
  const result = await db.select().from(games).where(eq(games.id, gameId));
  return result[0];
}

export async function createGame(gameData: {
  id: string;
  whiteId: number;
  blackId: number;
  timeControlInitial: number;
  timeControlIncrement: number;
  rated: boolean;
}) {
  const game = {
    id: gameData.id,
    whiteId: gameData.whiteId,
    blackId: gameData.blackId,
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
    timeControlInitial: gameData.timeControlInitial,
    timeControlIncrement: gameData.timeControlIncrement,
    moves: "",
    rated: gameData.rated,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.insert(games).values(game).returning();
  return result[0];
}

export async function updateGame(gameId: string, updateData: Partial<Game>) {
  await db
    .update(games)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(eq(games.id, gameId));
  
  return await getGameById(gameId);
}

export async function getUserGames(userId: number, limit = 10) {
  return await db
    .select()
    .from(games)
    .where(
      sql`${games.whiteId} = ${userId} OR ${games.blackId} = ${userId}`
    )
    .orderBy(desc(games.updatedAt))
    .limit(limit);
}

export async function updateUserLastActiveTime(userId: number) {
  await db
    .update(users)
    .set({
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}
