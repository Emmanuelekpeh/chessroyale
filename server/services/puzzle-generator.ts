import { Chess } from 'chess.js';
import { storage } from '../storage';
import type { InsertPuzzle } from '@shared/schema';
import { StockfishEngine } from './stockfish-engine';
import { ratingPredictor } from './rating-prediction';

export class PuzzleGenerator {
  private engine: StockfishEngine;

  constructor() {
    this.engine = new StockfishEngine();
  }

  async generatePuzzle(): Promise<InsertPuzzle | null> {
    const game = new Chess();

    // Generate a semi-random position (10-15 moves)
    const moves = Math.floor(Math.random() * 5) + 10;

    try {
      for (let i = 0; i < moves; i++) {
        const legalMoves = game.moves();
        if (legalMoves.length === 0) break;

        // Choose moves that are more likely to create tactical positions
        const tacticalMoves = legalMoves.filter(move =>
          move.includes('x') || // Captures
          move.includes('+') || // Checks
          move.includes('#') || // Checkmate
          move.includes('=')    // Pawn promotion
        );

        const movePool = tacticalMoves.length > 0 ? tacticalMoves : legalMoves;
        const randomMove = movePool[Math.floor(Math.random() * movePool.length)];
        game.move(randomMove);
      }

      // Analyze the position
      const analysis = await this.engine.analyzeFen(game.fen(), 3000);

      // Only create puzzle if there's a significant advantage (> 2 pawns)
      if (Math.abs(analysis.score) >= 2) {
        const tacticalThemes = this.identifyTacticalThemes(game, analysis);
        const difficulty = this.calculateDifficulty(analysis);

        const puzzle: InsertPuzzle = {
          creatorId: 1, // System user ID
          fen: game.fen(),
          solution: analysis.line?.slice(0, 3).join(' ') || analysis.bestMove,
          title: `${tacticalThemes[0]} Puzzle`,
          description: `Find the best move sequence in this ${tacticalThemes[0].toLowerCase()} position`,
          tacticalTheme: tacticalThemes,
          difficulty,
        };

        // Predict rating using ML model
        puzzle.rating = await ratingPredictor.predictRating(puzzle);
        console.log(`Predicted rating for puzzle: ${puzzle.rating}`);

        return puzzle;
      }

      return null;
    } catch (error) {
      console.error('Error generating puzzle:', error);
      return null;
    }
  }

  private identifyTacticalThemes(game: Chess, analysis: StockfishAnalysis): string[] {
    const themes: string[] = [];
    const testGame = new Chess(game.fen());

    if (!analysis.line || analysis.line.length === 0) {
      return ['tactical'];
    }

    try {
      // Make the first move of the solution
      const firstMove = analysis.line[0];
      testGame.move(firstMove);

      // Check for tactical patterns
      const position = testGame.fen();
      const moveString = analysis.line.join(' ');

      if (testGame.isCheckmate()) {
        themes.push('mate');
      }

      if (firstMove.includes('x')) {
        const materialAfter = this.evaluateMaterial(testGame);
        themes.push('capture');

        // Check if it's a sacrifice
        if (analysis.line.length > 1) {
          const tempGame = new Chess(game.fen());
          tempGame.move(analysis.line[0]);
          tempGame.move(analysis.line[1]);
          if (this.evaluateMaterial(tempGame) < materialAfter) {
            themes.push('sacrifice');
          }
        }
      }

      // Fork detection - piece attacks multiple targets
      if (this.hasFork(testGame, firstMove)) {
        themes.push('fork');
      }

      // Pin detection - piece can't move due to exposed attack
      if (this.hasPin(testGame)) {
        themes.push('pin');
      }

    } catch (error) {
      console.error('Error identifying themes:', error);
    }

    return themes.length > 0 ? themes : ['tactical'];
  }

  private evaluateMaterial(game: Chess): number {
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let total = 0;
    const fen = game.fen().split(' ')[0];

    for (const char of fen) {
      const value = values[char.toLowerCase() as keyof typeof values];
      if (value) {
        total += char === char.toUpperCase() ? value : -value;
      }
    }
    return total;
  }

  private hasFork(game: Chess, move: string): boolean {
    const attackedSquares = new Set<string>();
    const piece = move.charAt(0).toUpperCase();
    const targetSquare = move.slice(-2);

    // Get all possible moves from the target square
    const possibleMoves = game.moves({ square: targetSquare, verbose: true });

    // Count unique pieces under attack
    for (const move of possibleMoves) {
      if (move.flags.includes('c')) { // Capture flag
        attackedSquares.add(move.to);
      }
    }

    return attackedSquares.size >= 2;
  }

  private hasPin(game: Chess): boolean {
    const moves = game.moves({ verbose: true });
    const pinnedMoves = moves.filter(move =>
      move.flags.includes('p') || // Piece is pinned
      move.san.includes('+')      // Move gives check
    );
    return pinnedMoves.length > 0;
  }

  private calculateDifficulty(analysis: StockfishAnalysis): 'beginner' | 'intermediate' | 'advanced' {
    const score = Math.abs(analysis.score);
    const depth = analysis.depth;
    const lineLength = analysis.line?.length || 1;

    if (score > 5 || (depth < 15 && lineLength <= 2)) {
      return 'beginner';
    } else if (score > 3 || (depth < 20 && lineLength <= 3)) {
      return 'intermediate';
    }
    return 'advanced';
  }

  private puzzleCache: Map<string, any> = new Map();

  async generateBatch(count: number = 10): Promise<void> {
    console.log(`Starting batch generation of ${count} puzzles...`);
    let successCount = 0;
    const cacheKey = `batch_${count}`;
    
    if (this.puzzleCache.has(cacheKey)) {
      return this.puzzleCache.get(cacheKey);
    }

    for (let i = 0; i < count * 2; i++) { // Try twice as many times to get enough good puzzles
      if (successCount >= count) break;

      const puzzle = await this.generatePuzzle();
      if (puzzle) {
        try {
          await storage.createPuzzle(puzzle);
          successCount++;
          console.log(`Generated puzzle ${successCount}/${count}: ${puzzle.title}`);
        } catch (error) {
          console.error('Error saving puzzle:', error);
        }
      }
    }

    console.log(`Successfully generated ${successCount} puzzles`);
  }

  cleanup() {
    this.engine.quit();
    ratingPredictor.cleanup();
  }
}