import { users, puzzles, userPuzzleHistory, achievements, userAchievements, puzzleRatingHistory, games, type User, type InsertUser, type Puzzle, type InsertPuzzle, type UserPuzzleHistory, type InsertUserPuzzleHistory, type PuzzleRatingHistory, type Game } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { type Store } from "express-session";
import createMemoryStore from "memorystore";
import session from "express-session";
import { spawn } from 'child_process';

const MemoryStore = createMemoryStore(session);

interface IStorage {
  sessionStore: Store;
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string | null): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: number, stats: Partial<User>): Promise<User>;

  // Puzzle methods
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  getPuzzle(id: number): Promise<Puzzle | undefined>;
  getPuzzles(verified?: boolean): Promise<Puzzle[]>;
  verifyPuzzle(id: number): Promise<Puzzle>;

  // Puzzle history methods
  getUserPuzzleHistory(userId: number): Promise<UserPuzzleHistory[]>;
  updatePuzzleHistory(history: InsertUserPuzzleHistory): Promise<UserPuzzleHistory>;
  getRecommendedPuzzles(userId: number, count?: number): Promise<Puzzle[]>;

  // Achievement methods
  checkAndAwardAchievements(userId: number): Promise<string[]>;
  getUserAchievements(userId: number): Promise<any[]>;
  updateUserScore(userId: number, points: number): Promise<User>;

  // Puzzle rating history methods
  getPuzzleRatingHistory(puzzleId: number): Promise<PuzzleRatingHistory[]>;
  recordPuzzleRatingChange(
    puzzleId: number,
    oldRating: number,
    newRating: number,
    metrics: {
      totalAttempts: number;
      successRate: number;
      averageTimeToSolve: number;
    }
  ): Promise<PuzzleRatingHistory>;
  createInitialPuzzles(): Promise<void>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: Omit<Game, 'id' | 'startTime' | 'lastMove' | 'lastMoveBy' | 'winnerId'>): Promise<Game>;
  updateGame(id: number, data: Partial<Game>): Promise<Game>;

  // User progress tracking
  updateUserProgress(userId: number, update: {
    strongestThemes?: string[];
    weakestThemes?: string[];
    learningGoals?: string[];
    lastActiveAt?: Date;
  }): Promise<User>;
}

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;

  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / values.length;

  return Math.sqrt(avgSquareDiff);
};

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string | null): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      rating: insertUser.rating ?? 1200,
      gamesPlayed: insertUser.gamesPlayed ?? 0,
      gamesWon: insertUser.gamesWon ?? 0,
      puzzlesSolved: insertUser.puzzlesSolved ?? 0,
      score: insertUser.score ?? 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPoints: 0,
      level: 1,
      isGuest: insertUser.isGuest ?? false,
    }).returning();
    return user;
  }

  async updateUserStats(userId: number, stats: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(stats)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const [created] = await db.insert(puzzles).values(puzzle).returning();
    return created;
  }

  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, id));
    return puzzle;
  }

  async getPuzzles(verified?: boolean): Promise<Puzzle[]> {
    let query = db.select().from(puzzles);
    if (verified !== undefined) {
      query = query.where(eq(puzzles.verified, verified));
    }
    return await query;
  }

  async verifyPuzzle(id: number): Promise<Puzzle> {
    const [puzzle] = await db
      .update(puzzles)
      .set({ verified: true })
      .where(eq(puzzles.id, id))
      .returning();
    return puzzle;
  }

  async getUserPuzzleHistory(userId: number): Promise<UserPuzzleHistory[]> {
    return await db
      .select()
      .from(userPuzzleHistory)
      .where(eq(userPuzzleHistory.userId, userId))
      .orderBy(desc(userPuzzleHistory.solvedAt));
  }

  async updatePuzzleHistory(history: InsertUserPuzzleHistory): Promise<UserPuzzleHistory> {
    const [record] = await db
      .insert(userPuzzleHistory)
      .values(history)
      .returning();
    return record;
  }

  async getRecommendedPuzzles(userId: number, count: number = 5): Promise<Puzzle[]> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    return await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.verified, true))
      .limit(count);
  }

  async checkAndAwardAchievements(userId: number): Promise<string[]> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const earnedAchievements: string[] = [];
    // Achievement checking logic here
    return earnedAchievements;
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async updateUserScore(userId: number, points: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        score: sql`${users.score} + ${points}`,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPuzzleRatingHistory(puzzleId: number): Promise<PuzzleRatingHistory[]> {
    return await db
      .select()
      .from(puzzleRatingHistory)
      .where(eq(puzzleRatingHistory.puzzleId, puzzleId))
      .orderBy(desc(puzzleRatingHistory.calibratedAt));
  }

  async recordPuzzleRatingChange(
    puzzleId: number,
    oldRating: number,
    newRating: number,
    metrics: {
      totalAttempts: number;
      successRate: number;
      averageTimeToSolve: number;
    }
  ): Promise<PuzzleRatingHistory> {
    const [record] = await db
      .insert(puzzleRatingHistory)
      .values({
        puzzleId,
        oldRating,
        newRating,
        ratingChange: newRating - oldRating,
        totalAttempts: metrics.totalAttempts,
        successRate: metrics.successRate,
        averageTimeToSolve: metrics.averageTimeToSolve,
        calibratedAt: new Date()
      })
      .returning();
    return record;
  }

  async createInitialPuzzles(): Promise<void> {
    const initialPuzzles: InsertPuzzle[] = [
      {
        creatorId: 1,
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        solution: 'Nxe5',
        title: 'Simple Knight Fork',
        description: 'Find the knight fork to win material',
        rating: 1200,
        tacticalTheme: ['fork'],
        difficulty: 'beginner',
        verified: true
      },
      {
        creatorId: 1,
        fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
        solution: 'Qh5',
        title: 'Scholar\'s Mate Pattern',
        description: 'Find the attacking move that threatens checkmate',
        rating: 1000,
        tacticalTheme: ['mate'],
        difficulty: 'beginner',
        verified: true
      }
    ];

    for (const puzzle of initialPuzzles) {
      await this.createPuzzle(puzzle);
    }
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, id));
    return game;
  }

  async createGame(game: Omit<Game, 'id' | 'startTime' | 'lastMove' | 'lastMoveBy' | 'winnerId'>): Promise<Game> {
    const [created] = await db
      .insert(games)
      .values({
        ...game,
        startTime: new Date(),
        status: game.status || 'pending',
      })
      .returning();
    return created;
  }

  async updateGame(id: number, data: Partial<Game>): Promise<Game> {
    const [updated] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return updated;
  }

  async updateUserProgress(userId: number, update: {
    strongestThemes?: string[];
    weakestThemes?: string[];
    learningGoals?: string[];
    lastActiveAt?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...update,
        lastActiveAt: update.lastActiveAt || new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();