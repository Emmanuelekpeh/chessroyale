import { expect, test, beforeAll, afterAll, describe } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { puzzles, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { Chess } from 'chess.js';

describe('Puzzle Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    console.log('Setting up puzzle test environment...');
    
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
    
    console.log('Test user created:', testUser.id);
  });

  afterAll(async () => {
    console.log('Cleaning up puzzle test environment...');
    
    try {
      // Clean up test data
      if (testUser?.id) {
        await db.delete(puzzles).where(eq(puzzles.creatorId, testUser.id));
        await db.delete(users).where(eq(users.id, testUser.id));
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });

  test('should create and validate a puzzle', async () => {
    const puzzle = await storage.createPuzzle({
      title: 'Test Puzzle',
      description: 'A test puzzle for validation',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: 'e4 e5',
      rating: 1200,
      difficulty: 'beginner',
      tacticalTheme: ['opening'],
      creatorId: testUser.id,
      isComputerGenerated: false,
      verified: false
    });

    expect(puzzle).toBeDefined();
    expect(puzzle.id).toBeDefined();
    expect(puzzle.solution).toBe('e4 e5');

    // Validate the puzzle's solution
    const chess = new Chess(puzzle.fen);
    const moves = puzzle.solution.split(' ');
    
    // Try each move in the solution
    for (const move of moves) {
      const result = chess.move(move);
      expect(result).not.toBeNull();
    }
  });

  test('should handle invalid puzzle creation', async () => {
    await expect(storage.createPuzzle({
      title: 'Invalid Puzzle',
      description: 'A puzzle with invalid FEN',
      fen: 'invalid fen string',
      solution: 'e4',
      rating: 1200,
      difficulty: 'beginner',
      tacticalTheme: ['opening'],
      creatorId: testUser.id,
      isComputerGenerated: false,
      verified: false
    })).rejects.toThrow();
  });

  test('should calculate puzzle rating after attempts', async () => {
    const puzzle = await storage.createPuzzle({
      title: 'Rating Test Puzzle',
      description: 'Testing rating calculations',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: 'e4',
      rating: 1500,
      difficulty: 'intermediate',
      tacticalTheme: ['opening'],
      creatorId: testUser.id,
      isComputerGenerated: false,
      verified: true
    });

    // Simulate puzzle attempts
    await storage.updatePuzzleHistory({
      userId: testUser.id,
      puzzleId: puzzle.id,
      attempts: 1,
      hintsUsed: 0,
      completed: true,
      timeSpent: 30,
      rating: 1500
    });

    const updatedPuzzle = await storage.getPuzzle(puzzle.id);
    expect(updatedPuzzle?.totalAttempts).toBe(1);
    expect(updatedPuzzle?.successfulAttempts).toBe(1);
    expect(updatedPuzzle?.averageTimeToSolve).toBe(30);
  });

  test('should handle puzzle recommendation', async () => {
    // Create a set of puzzles with different ratings
    const puzzleRatings = [800, 1000, 1200, 1400, 1600];
    const createdPuzzles = await Promise.all(
      puzzleRatings.map(rating => storage.createPuzzle({
        title: `Rating ${rating} Puzzle`,
        description: `Puzzle with rating ${rating}`,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: 'e4',
        rating,
        difficulty: rating < 1200 ? 'beginner' : 'intermediate',
        tacticalTheme: ['opening'],
        creatorId: testUser.id,
        isComputerGenerated: false,
        verified: true
      }))
    );

    // Get recommended puzzles
    const recommended = await storage.getRecommendedPuzzles(testUser.id, 3);
    expect(recommended).toHaveLength(3);
    
    // Verify recommendations are within an appropriate rating range of the user
    for (const puzzle of recommended) {
      expect(Math.abs(puzzle.rating - testUser.rating)).toBeLessThan(400);
    }
  });
});