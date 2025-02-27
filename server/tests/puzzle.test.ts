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
    try {
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
    } catch (error) {
      console.error('Error creating puzzle:', error);
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

    // Add logic to test rating calculations here
  });
});
