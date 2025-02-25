import type { Puzzle, UserPuzzleHistory, User } from "../../shared/schema";

export class PuzzleRecommender {
  async generateRecommendations(
    user: User,
    completedPuzzles: (Puzzle & { history: UserPuzzleHistory })[],
    availablePuzzles: Puzzle[],
    count: number = 5
  ) {
    // Simple rating-based recommendation
    return {
      recommendations: availablePuzzles
        .filter(puzzle => !completedPuzzles.find(cp => cp.id === puzzle.id))
        .sort((a, b) => Math.abs(a.rating - user.rating) - Math.abs(b.rating - user.rating))
        .slice(0, count),
      nextDifficulty: "same",
      focusAreas: [],
    };
  }
}
