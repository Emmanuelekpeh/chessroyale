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

  // New methods for enhanced user progress tracking
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
      .set({
        ...stats,
        lastActiveAt: new Date(), // Always update lastActiveAt when stats change
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    console.log('Creating new puzzle:', puzzle);
    try {
      const [created] = await db
        .insert(puzzles)
        .values({
          ...puzzle,
          rating: puzzle.rating,
          verified: false,
          hintsAvailable: 0,
          pointValue: this.calculatePuzzlePoints(puzzle.rating, puzzle.difficulty || 'beginner'),
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageRatingDelta: 0,
          lastCalibrationAt: new Date(),
          createdAt: new Date(),
        })
        .returning();
      console.log('Created puzzle:', created);
      return created;
    } catch (error) {
      console.error('Error creating puzzle:', error);
      throw error;
    }
  }

  private calculatePuzzlePoints(rating: number, difficulty: string): number {
    const basePoints = 10;
    const ratingMultiplier = Math.floor(rating / 400); // Every 400 rating points increases multiplier
    const difficultyMultiplier =
      difficulty === 'advanced' ? 2.0 :
        difficulty === 'intermediate' ? 1.5 : 1.0;

    return Math.floor(basePoints * (1 + ratingMultiplier) * difficultyMultiplier);
  }

  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.id, id));
    return puzzle;
  }

  async getPuzzles(verified?: boolean): Promise<Puzzle[]> {
    try {
      console.log('Getting puzzles from database...');
      let query = db.select().from(puzzles);
      if (verified !== undefined) {
        console.log('Filtering for verified puzzles:', verified);
        query = query.where(eq(puzzles.verified, verified));
      }
      const result = await query;
      if (!result || !Array.isArray(result)) {
        throw new Error('Invalid puzzle data returned from database');
      }
      console.log(`Found ${result.length} puzzles`);
      return result;
    } catch (error) {
      console.error('Error in getPuzzles:', error);
      throw error;
    }
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
      .orderBy(desc(userPuzzleHistory.lastAttemptAt));
  }

  private async calculateRatingAdjustment(metrics: {
    successRate: number;
    avgHints: number;
    avgAttempts: number;
    avgRatingDiff: number;
    highRatedSuccesses: number;
    veryHighRatedSuccesses: number;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', ['server/services/puzzle-rating.py']);
      let resultData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        resultData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', errorData);
          // Fallback to simple calculation if Python fails
          const fallbackDelta = Math.floor((metrics.successRate < 40 ? 400 : -200) *
            (1 + metrics.avgAttempts / 10) *
            (1 - metrics.avgHints / 5));
          resolve(fallbackDelta);
          return;
        }

        try {
          const result = JSON.parse(resultData);
          resolve(result.ratingDelta);
        } catch (error) {
          console.error('Failed to parse Python output:', error);
          reject(error);
        }
      });

      // Send metrics to Python script
      pythonProcess.stdin.write(JSON.stringify(metrics));
      pythonProcess.stdin.end();
    });
  }

  async calculateNewPuzzleRating(puzzleId: number): Promise<number> {
    const puzzle = await this.getPuzzle(puzzleId);
    if (!puzzle) throw new Error('Puzzle not found');

    console.log(`Calculating new rating for puzzle ${puzzleId}, current rating: ${puzzle.rating}`);

    const history = await db
      .select()
      .from(userPuzzleHistory)
      .where(eq(userPuzzleHistory.puzzleId, puzzleId))
      .orderBy(desc(userPuzzleHistory.lastAttemptAt))
      .limit(50);  // Consider last 50 attempts for calibration

    if (history.length < 5) {
      console.log(`Not enough attempts (${history.length}) to calibrate puzzle ${puzzleId}`);
      return puzzle.rating ?? 1200;  // Need minimum data points
    }

    try {
      const metrics = {
        successCount: 0,
        totalTime: 0,
        totalHints: 0,
        ratingDiffSum: 0,
        highRatedSuccesses: 0,
        veryHighRatedSuccesses: 0,
        timeDistribution: [] as number[],
      };

      // Calculate basic metrics
      console.log('Processing attempt history:', history.length, 'attempts');
      for (const attempt of history) {
        const user = await this.getUser(attempt.userId);
        if (!user) {
          console.log(`Skipping attempt, user ${attempt.userId} not found`);
          continue;
        }

        metrics.totalHints += attempt.hintsUsed ?? 0;
        if (attempt.completed) {
          metrics.successCount++;
          metrics.totalTime += attempt.timeSpent ?? 0;
          metrics.timeDistribution.push(attempt.timeSpent ?? 0);
          const ratingDiff = (user.rating ?? 1200) - (puzzle.rating ?? 1200);
          metrics.ratingDiffSum += ratingDiff;

          if (ratingDiff > 200) {
            metrics.highRatedSuccesses++;
            if (ratingDiff > 400) {
              metrics.veryHighRatedSuccesses++;
            }
          }
        }
      }

      // Calculate final metrics
      const successRate = metrics.successCount ? (metrics.successCount / history.length * 100) : 0;
      const avgTime = metrics.successCount ? (metrics.totalTime / metrics.successCount) : 0;
      const avgHints = history.length ? (metrics.totalHints / history.length) : 0;
      const avgAttempts = history.length ?
        history.reduce((acc, curr) => acc + (curr.attempts ?? 1), 0) / history.length : 0;
      const avgRatingDiff = metrics.successCount ? (metrics.ratingDiffSum / metrics.successCount) : 0;

      // Calculate rating adjustment using the class method
      const ratingDelta = await this.calculateRatingAdjustment({
        successRate,
        avgHints,
        avgAttempts,
        avgRatingDiff,
        highRatedSuccesses: metrics.highRatedSuccesses,
        veryHighRatedSuccesses: metrics.veryHighRatedSuccesses
      });

      const oldRating = puzzle.rating ?? 1200;
      const newRating = Math.max(500, Math.min(3000, oldRating + ratingDelta));
      console.log(`Final rating change: ${oldRating} -> ${newRating} (delta: ${ratingDelta})`);

      return newRating;
    } catch (error) {
      console.error('Error calculating puzzle rating:', error);
      throw error;
    }
  }

  async recalibratePuzzleDifficulty(puzzleId: number): Promise<Puzzle> {
    try {
      // Get the new rating calculation
      const newRating = await this.calculateNewPuzzleRating(puzzleId);
      const puzzle = await this.getPuzzle(puzzleId);
      if (!puzzle) throw new Error('Puzzle not found');

      // Update puzzle rating in a single transaction
      const [updated] = await db.transaction(async (tx) => {
        // Update the puzzle rating
        const [updatedPuzzle] = await tx
          .update(puzzles)
          .set({
            rating: newRating,
            lastCalibrationAt: new Date()
          })
          .where(eq(puzzles.id, puzzleId))
          .returning();

        // Record the rating history
        const successRate = puzzle.totalAttempts ?
          ((puzzle.successfulAttempts ?? 0) / puzzle.totalAttempts * 100) : 0;

        await tx
          .insert(puzzleRatingHistory)
          .values({
            puzzleId,
            oldRating: puzzle.rating ?? 1200,
            newRating,
            ratingChange: newRating - (puzzle.rating ?? 1200),
            totalAttempts: puzzle.totalAttempts ?? 0,
            successRate: Math.max(0, Math.min(100, successRate)),
            averageTimeToSolve: puzzle.averageTimeToSolve ?? 0,
            calibratedAt: new Date()
          });

        return [updatedPuzzle];
      });

      return updated;
    } catch (error) {
      console.error('Error in recalibratePuzzleDifficulty:', error);
      throw error;
    }
  }

  async updatePuzzleHistory(history: InsertUserPuzzleHistory): Promise<UserPuzzleHistory> {
    const puzzleHistory = await db.transaction(async (tx) => {
      // Get the puzzle first to update its metrics
      const puzzle = await this.getPuzzle(history.puzzleId);
      if (!puzzle) throw new Error('Puzzle not found');

      // Calculate new puzzle metrics
      const totalAttempts = (puzzle.totalAttempts || 0) + 1;
      const successfulAttempts = (puzzle.successfulAttempts || 0) + (history.completed ? 1 : 0);
      const currentAvgTime = puzzle.averageTimeToSolve || 0;
      const newAvgTime = history.completed ?
        Math.round((currentAvgTime * (successfulAttempts - 1) + (history.timeSpent || 0)) / successfulAttempts) :
        currentAvgTime;

      // Update puzzle metrics
      await tx.update(puzzles)
        .set({
          totalAttempts,
          successfulAttempts,
          averageTimeToSolve: newAvgTime,
        })
        .where(eq(puzzles.id, history.puzzleId));

      const [created] = await tx
        .insert(userPuzzleHistory)
        .values({
          ...history,
          lastAttemptAt: new Date()
        })
        .returning();

      if (created.completed) {
        const hintPenalty = Math.max(0, 1 - ((created.hintsUsed ?? 0) * 0.2));
        const timeBonus = Math.max(0, 1 + ((300 - (created.timeSpent ?? 0)) / 300));
        const earnedPoints = Math.floor((puzzle.pointValue ?? 10) * hintPenalty * timeBonus);

        await tx
          .update(userPuzzleHistory)
          .set({ pointsEarned: earnedPoints })
          .where(eq(userPuzzleHistory.id, created.id));

        const user = await this.getUser(created.userId);
        if (user) {
          await this.updateUserScore(user.id, earnedPoints);
        }

        // Trigger recalibration if enough new data points
        const attempts = await tx
          .select()
          .from(userPuzzleHistory)
          .where(eq(userPuzzleHistory.puzzleId, created.puzzleId))
          .execute();

        if (attempts.length % 5 === 0) {
          await this.recalibratePuzzleDifficulty(created.puzzleId);
        }
      }

      return [created];
    });

    return puzzleHistory[0];
  }

  async getRecommendedPuzzles(userId: number, count: number = 5): Promise<Puzzle[]> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const userRating = user.rating || 1200;
    const ratingRange = 400; // Maximum rating difference

    const history = await this.getUserPuzzleHistory(userId);
    const solvedPuzzleIds = history
      .filter(h => h.completed)
      .map(h => h.puzzleId);

    // Use SQL to filter puzzles within rating range and not solved
    const query = db
      .select()
      .from(puzzles)
      .where(
        sql`${puzzles.id} NOT IN (${solvedPuzzleIds.length > 0 ? solvedPuzzleIds.join(',') : '0'})
            AND ABS(${puzzles.rating} - ${userRating}) < ${ratingRange}
            AND ${puzzles.verified} = true`
      )
      .orderBy(sql`ABS(${puzzles.rating} - ${userRating})`)
      .limit(count);

    return await query;
  }

  async checkAndAwardAchievements(userId: number): Promise<string[]> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newAchievements: string[] = [];

    const unlockedAchievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const unlockedIds = unlockedAchievements.map(ua => ua.achievementId);

    const availableAchievements = await db
      .select()
      .from(achievements)
      .where(sql`id NOT IN (${unlockedIds.length > 0 ? unlockedIds.join(',') : '0'})`)
      .execute();

    for (const achievement of availableAchievements) {
      let earned = false;

      switch (achievement.type) {
        case 'puzzles_solved':
          earned = (user.puzzlesSolved ?? 0) >= achievement.requiredValue;
          break;
        case 'streak':
          earned = (user.bestStreak ?? 0) >= achievement.requiredValue;
          break;
        case 'rating':
          earned = (user.rating ?? 1200) >= achievement.requiredValue;
          break;
        case 'total_points':
          earned = (user.totalPoints ?? 0) >= achievement.requiredValue;
          break;
      }

      if (earned) {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
        });

        await this.updateUserScore(userId, achievement.pointReward);

        newAchievements.push(achievement.name);
      }
    }

    return newAchievements;
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(userPuzzleHistory)
      .where(eq(userPuzzleHistory.userId, userId))
      .innerJoin(achievements, eq(userPuzzleHistory.achievementId, achievements.id));
  }

  async updateUserScore(userId: number, points: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newTotalPoints = user.totalPoints + points;
    const newLevel = Math.floor(Math.sqrt(newTotalPoints / 100)) + 1;

    return await this.updateUserStats(userId, {
      totalPoints: newTotalPoints,
      level: newLevel,
    });
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
    // Ensure all numeric values are valid
    const validatedMetrics = {
      totalAttempts: Math.max(0, metrics.totalAttempts),
      successRate: Math.max(0, Math.min(100, metrics.successRate || 0)),
      averageTimeToSolve: Math.max(0, metrics.averageTimeToSolve || 0)
    };

    const [record] = await db
      .insert(puzzleRatingHistory)
      .values({
        puzzleId,
        oldRating,
        newRating,
        ratingChange: newRating - oldRating,
        ...validatedMetrics,
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