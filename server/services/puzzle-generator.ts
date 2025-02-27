import { Chess } from 'chess.js';

class PuzzleGenerator {

  // Function to identify themes in a game
  private identifyThemes(game: Chess, firstMove: string, analysis: any): string[] {
    const themes: string[] = [];
    const testGame = new Chess(game.fen());

    try {
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

  // Function to evaluate material balance on the board
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

  // Function to check if the move is a fork
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

  // Function to check if there's a pin
  private hasPin(game: Chess): boolean {
    const moves = game.moves({ verbose: true });
    const pinnedMoves = moves.filter(move =>
      move.flags.includes('p') || // Piece is pinned
      move.san.includes('+')      // Move gives check
    );
    return pinnedMoves.length > 0;
  }

  // Function to calculate puzzle difficulty
  private calculateDifficulty(analysis: any): 'beginner' | 'intermediate' | 'advanced' {
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

  // Function to generate a batch of puzzles
  async generateBatch(count: number = 10): Promise<void> {
    console.log(`Starting batch generation of ${count} puzzles...`);
    let successCount = 0;
    const cacheKey = `batch_${count}`;

    if (this.puzzleCache.has(cacheKey)) {
      return this.puzzleCache.get(cacheKey);
    }
    // Add logic for puzzle generation here
  }

  private puzzleCache: Map<string, any> = new Map();
}
