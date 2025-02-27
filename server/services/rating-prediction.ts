import { Chess } from 'chess.js';

interface PuzzleFeatures {
  materialBalance: number;
  moveComplexity: number;
  stockfishEval: number;
  tacticalThemes: number;
  solution_length: number;
}

/**
 * Class to predict the rating of chess puzzles based on various features.
 */
export class RatingPredictor {
  private stockfish: StockfishEngine;

  constructor() {
    this.stockfish = new StockfishEngine();
  }

  /**
   * Extract features from a given puzzle.
   * @param puzzle - The puzzle to extract features from.
   * @returns The extracted features.
   */
  private async extractFeatures(puzzle: InsertPuzzle): Promise<PuzzleFeatures> {
    const game = new Chess(puzzle.fen);

    // Calculate material balance
    const materialBalance = this.calculateMaterialBalance(game);

    // Calculate move complexity
    const moveComplexity = this.calculateMoveComplexity(puzzle.solution);

    // Get stockfish evaluation
    const stockfishEval = await this.getStockfishEvaluation(puzzle.fen);

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
  private
