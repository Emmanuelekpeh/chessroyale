import { storage } from '../storage';
import { db } from '../db';

interface RecommendationCriteria {
  userRating: number;
  recentPerformance: number;
  preferredThemes: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  lastLoginStreak: number;
}

export class EnhancedPuzzleRecommender {
  async getRecommendedPuzzles(userId: number, count: number = 5): Promise<Puzzle[]> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const criteria = await this.buildRecommendationCriteria(user);
    
    // Get puzzles within appropriate rating range
    const basePuzzles = await this.getBaseRecommendations(criteria, count * 2);
    
    // Score and sort puzzles based on multiple factors
    const scoredPuzzles = this.scorePuzzles(basePuzzles, criteria);
    
    // Return top N puzzles
    return scoredPuzzles.slice(0, count);
  }

  private async buildRecommendationCriteria(user: User): Promise<RecommendationCriteria> {
    const history = await storage.getUserPuzzleHistory(user.id);
    const recentHistory = history.slice(0, 10);
    
    return {
      userRating: user.rating ?? 1200,
      recentPerformance: this.calculateRecentPerformance(recentHistory),
      preferredThemes: await this.analyzePreferredThemes(history),
      timeOfDay: this.getTimeOfDay(),
      lastLoginStreak: user.currentStreak ?? 0
    };
  }

  private scorePuzzles(puzzles: Puzzle[], criteria: RecommendationCriteria): Puzzle[] {
    return puzzles
      .map(puzzle => ({
        puzzle,
        score: this.calculatePuzzleScore(puzzle, criteria)
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ puzzle }) => puzzle);
  }
}
