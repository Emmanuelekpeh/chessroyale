import { z } from "zod";

// Lichess API schemas
const lichessPuzzleSchema = z.object({
  game: z.object({
    fen: z.string(),
    moves: z.array(z.string()),
  }),
  puzzle: z.object({
    id: z.string(),
    rating: z.number(),
    themes: z.array(z.string()),
    solution: z.array(z.string()),
  }),
});

export class ChessApiService {
  private readonly lichessBaseUrl = 'https://lichess.org/api';
  private readonly lichessToken: string;

  constructor(lichessToken?: string) {
    this.lichessToken = lichessToken || '';
  }

  // Import puzzles from Lichess
  async importPuzzlesFromLichess(count: number = 10) {
    try {
      const puzzles = [];
      const headers: HeadersInit = {
        Accept: 'application/x-ndjson',
      };
      if (this.lichessToken) {
        headers.Authorization = `Bearer ${this.lichessToken}`;
      }

      // Fetch puzzles from activity feed
      const response = await fetch(
        `${this.lichessBaseUrl}/puzzle/activity?max=${count}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.statusText}`);
      }

      const text = await response.text();
      const puzzleData = text
        .trim()
        .split('\n')
        .map(line => {
          try {
            const puzzle = JSON.parse(line);
            lichessPuzzleSchema.parse(puzzle); // Validate puzzle format
            return {
              fen: puzzle.game.fen,
              solution: puzzle.puzzle.solution.join(' '),
              rating: puzzle.puzzle.rating,
              themes: puzzle.puzzle.themes,
              isDaily: false,
            };
          } catch (err) {
            console.error('Failed to parse puzzle:', err);
            return null;
          }
        })
        .filter(Boolean); // Remove any failed parses

      return puzzleData;
    } catch (error) {
      console.error('Error importing Lichess puzzles:', error);
      throw error;
    }
  }

  // Create study from puzzles
  async createStudyFromPuzzles(title: string, puzzles: { fen: string; solution: string }[]) {
    if (!this.lichessToken) {
      throw new Error('Lichess token is required to create studies');
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.lichessToken}`,
      };

      const response = await fetch(`${this.lichessBaseUrl}/study`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: title,
          visibility: 'unlisted',
          chapters: puzzles.map((puzzle, index) => ({
            name: `Puzzle ${index + 1}`,
            fen: puzzle.fen,
            pgn: puzzle.solution,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create study: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Lichess study:', error);
      throw error;
    }
  }
}