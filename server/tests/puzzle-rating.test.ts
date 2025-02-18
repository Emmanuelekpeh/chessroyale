import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { users, puzzles, userPuzzleHistory, puzzleRatingHistory } from '../shared/schema';
import { eq } from 'drizzle-orm';

describe('Puzzle Rating System', () => {
  const initialPuzzleRating = 1500;
  let testUser;
  let testPuzzle;

  beforeAll(async () => {
    // Create test user
    testUser = await storage.createUser({
      username: `test_user_${Date.now()}`,
      password: 'test123',
      isGuest: false,
      rating: 1200,
      gamesPlayed: 0,
      gamesWon: 0,
      puzzlesSolved: 0,
      score: 0
    });

    // Create test puzzle
    testPuzzle = await storage.createPuzzle({
      creatorId: testUser.id,
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      solution: 'Nf3',
      rating: initialPuzzleRating,
      title: 'Test Puzzle',
      description: 'A puzzle for testing rating adjustments',
      tacticalTheme: ['development'],
      difficulty: 'intermediate'
    });
  });

  afterAll(async () => {
    if (testPuzzle?.id) {
      // Delete in order: rating history, puzzle history, puzzle
      await db.delete(puzzleRatingHistory).where(eq(puzzleRatingHistory.puzzleId, testPuzzle.id));
      await db.delete(userPuzzleHistory).where(eq(userPuzzleHistory.puzzleId, testPuzzle.id));
      await db.delete(puzzles).where(eq(puzzles.id, testPuzzle.id));
    }
    if (testUser?.id) {
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  test('should decrease rating when puzzle is too easy', async () => {
    // Simulate multiple successful fast completions
    for (let i = 0; i < 5; i++) {
      await storage.updatePuzzleHistory({
        userId: testUser.id,
        puzzleId: testPuzzle.id,
        attempts: 1,
        hintsUsed: 0,
        completed: true,
        timeSpent: 120, // Fast completion (2 minutes)
        rating: testUser.rating
      });
    }

    const updatedPuzzle = await storage.recalibratePuzzleDifficulty(testPuzzle.id);
    expect(updatedPuzzle.rating).toBeLessThan(initialPuzzleRating);
  });

  test('should increase rating when puzzle is too hard', async () => {
    // Reset puzzle rating
    await db.update(puzzles)
      .set({ rating: initialPuzzleRating })
      .where(eq(puzzles.id, testPuzzle.id));

    // Simulate multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await storage.updatePuzzleHistory({
        userId: testUser.id,
        puzzleId: testPuzzle.id,
        attempts: 3,
        hintsUsed: 2,
        completed: false,
        timeSpent: 600, // Long attempt (10 minutes)
        rating: testUser.rating
      });
    }

    const updatedPuzzle = await storage.recalibratePuzzleDifficulty(testPuzzle.id);
    expect(updatedPuzzle.rating).toBeGreaterThan(initialPuzzleRating);
  });

  test('should penalize puzzles requiring many hints', async () => {
    // Reset puzzle rating
    await db.update(puzzles)
      .set({ rating: initialPuzzleRating })
      .where(eq(puzzles.id, testPuzzle.id));

    // Simulate completions with heavy hint usage
    for (let i = 0; i < 5; i++) {
      await storage.updatePuzzleHistory({
        userId: testUser.id,
        puzzleId: testPuzzle.id,
        attempts: 1,
        hintsUsed: 3,
        completed: true,
        timeSpent: 300,
        rating: testUser.rating
      });
    }

    const updatedPuzzle = await storage.recalibratePuzzleDifficulty(testPuzzle.id);
    expect(updatedPuzzle.rating).toBeLessThan(initialPuzzleRating);
  });

  test('should handle rating adjustments based on player rating difference', async () => {
    // Reset puzzle rating
    await db.update(puzzles)
      .set({ rating: initialPuzzleRating })
      .where(eq(puzzles.id, testPuzzle.id));

    // Create a higher rated test user
    const strongerUser = await storage.createUser({
      username: `strong_user_${Date.now()}`,
      password: 'test123',
      isGuest: false,
      rating: 2000, // Much higher rated
      gamesPlayed: 0,
      gamesWon: 0,
      puzzlesSolved: 0,
      score: 0
    });

    // Simulate successful completions by stronger player
    for (let i = 0; i < 5; i++) {
      await storage.updatePuzzleHistory({
        userId: strongerUser.id,
        puzzleId: testPuzzle.id,
        attempts: 1,
        hintsUsed: 0,
        completed: true,
        timeSpent: 180,
        rating: strongerUser.rating
      });
    }

    const updatedPuzzle = await storage.recalibratePuzzleDifficulty(testPuzzle.id);

    // Cleanup stronger user
    if (strongerUser.id) {
      await db.delete(userPuzzleHistory).where(eq(userPuzzleHistory.userId, strongerUser.id));
      await db.delete(users).where(eq(users.id, strongerUser.id));
    }

    // Rating should increase due to successful completions by higher rated player
    expect(updatedPuzzle.rating).toBeGreaterThan(initialPuzzleRating);
  });
});