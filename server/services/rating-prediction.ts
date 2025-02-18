import { Chess } from 'chess.js';
import type { InsertPuzzle } from '@shared/schema';
import { StockfishEngine } from './stockfish-engine';

interface PuzzleFeatures {
  materialBalance: number;
  moveComplexity: number;
  stockfishEval: number;
  tacticalThemes: number;
  solution_length: number;
}

export class RatingPredictor {
  private stockfish: StockfishEngine;

  constructor() {
    this.stockfish = new StockfishEngine();
  }

  private extractFeatures(puzzle: InsertPuzzle): PuzzleFeatures {
    const game = new Chess(puzzle.fen);

    // Calculate material balance
    const materialBalance = this.calculateMaterialBalance(game);

    // Calculate move complexity
    const moveComplexity = this.calculateMoveComplexity(puzzle.solution);

    // Get stockfish evaluation
    const stockfishEval = this.getStockfishEvaluation(puzzle.fen);

    // Count tactical themes
    const tacticalThemes = puzzle.tacticalTheme ? puzzle.tacticalTheme.length : 0;

    // Solution length
    const solution_length = puzzle.solution.split(' ').length;

    return {
      materialBalance,
      moveComplexity,
      stockfishEval,
      tacticalThemes,
      solution_length
    };
  }

  private static readonly PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
private batchSize = 100;
private predictionQueue: Array<{game: Chess, callback: Function}> = [];

private calculateMaterialBalance(game: Chess): number {
    const values = RatingPredictor.PIECE_VALUES;
    let balance = 0;
    const fen = game.fen().split(' ')[0];

    for (const char of fen) {
      const value = values[char.toLowerCase() as keyof typeof values];
      if (value) {
        balance += char === char.toUpperCase() ? value : -value;
      }
    }
    return Math.abs(balance); // Use absolute value as feature
  }

  private calculateMoveComplexity(solution: string): number {
    let complexity = 0;
    const moves = solution.split(' ');

    for (const move of moves) {
      if (move.includes('x')) complexity += 2; // Capture
      if (move.includes('+')) complexity += 1; // Check
      if (move.includes('#')) complexity += 3; // Checkmate
      if (move.includes('=')) complexity += 2; // Promotion
    }

    return complexity;
  }

  private async getStockfishEvaluation(fen: string): Promise<number> {
    try {
      const analysis = await this.stockfish.analyzeFen(fen, 1000);
      return Math.abs(analysis.score);
    } catch (error) {
      console.error('Error getting stockfish evaluation:', error);
      return 0;
    }
  }

  public async predictRating(puzzle: InsertPuzzle): Promise<number> {
    const features = await this.extractFeatures(puzzle);

    // Simple heuristic-based prediction (will be replaced with ML model)
    let baseRating = 1200;

    // Adjust based on material imbalance
    baseRating += features.materialBalance * 50;

    // Adjust based on move complexity
    baseRating += features.moveComplexity * 100;

    // Adjust based on stockfish evaluation
    baseRating += features.stockfishEval * 100;

    // Adjust based on tactical themes
    baseRating += features.tacticalThemes * 150;

    // Adjust based on solution length
    baseRating += features.solution_length * 50;

    // Normalize rating to reasonable range
    return Math.max(500, Math.min(3000, baseRating));
  }

  public cleanup() {
    this.stockfish.quit();
  }
}

export const ratingPredictor = new RatingPredictor();