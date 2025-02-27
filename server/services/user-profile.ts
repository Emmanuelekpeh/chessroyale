import { storage } from '../storage';

export interface UserStats {
  totalPuzzlesSolved: number;
  averageRating: number;
  recentActivity: PuzzleAttempt[];
  progressOverTime: Array<{date: Date; rating: number}>;
}

export class UserProfileService {
  async getUserStats(userId: number): Promise<UserStats> {
    const puzzleAttempts = await storage.getPuzzleAttempts(userId);
    const recentActivity = puzzleAttempts.slice(-10);
    
    return {
      totalPuzzlesSolved: puzzleAttempts.length,
      averageRating: this.calculateAverageRating(puzzleAttempts),
      recentActivity,
      progressOverTime: this.calculateProgressOverTime(puzzleAttempts)
    };
  }

  private calculateAverageRating(attempts: PuzzleAttempt[]): number {
    return attempts.reduce((sum, att) => sum + att.rating, 0) / attempts.length;
  }

  private calculateProgressOverTime(attempts: PuzzleAttempt[]): Array<{date: Date; rating: number}> {
    return attempts.map(att => ({
      date: att.timestamp,
      rating: att.rating
    }));
  }
}
