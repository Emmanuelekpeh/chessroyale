import OpenAI from "openai";
import { z } from "zod";
import type { Puzzle, UserPuzzleHistory, User } from "../../shared/schema";

// Define response schema for OpenAI
const recommendationResponseSchema = z.object({
  puzzles: z.array(z.object({
    id: z.number(),
    score: z.number(),
    reason: z.string(),
  })),
  next_difficulty: z.enum(["easier", "same", "harder"]),
  focus_areas: z.array(z.string()),
  learning_path: z.object({
    current_level: z.string(),
    next_concepts: z.array(z.string()),
    estimated_rating_potential: z.number()
  }).optional()
});

export class PuzzleRecommender {
  private openai: OpenAI;
  private readonly MODEL = "gpt-4"; // Use standard GPT-4 model

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateRecommendations(
    user: User,
    completedPuzzles: (Puzzle & { history: UserPuzzleHistory })[],
    availablePuzzles: Puzzle[],
    count: number = 5
  ) {
    try {
      // Prepare user performance data with enhanced metrics
      const performanceData = this.analyzeUserPerformance(completedPuzzles);
      const puzzlePool = this.preparePuzzlePool(availablePuzzles, completedPuzzles);

      // Create enhanced prompt for OpenAI
      const messages = [
        {
          role: "system" as const,
          content: `You are an expert chess puzzle recommendation system. Analyze the user's performance and recommend puzzles that will optimize their learning path.
          Consider:
          - Current rating: ${user.rating || 1200}
          - Success patterns across different tactical themes
          - Time spent vs. puzzle difficulty correlation
          - Learning curve and adaptation rate
          - Pattern recognition development

          Performance data:
          ${JSON.stringify(performanceData, null, 2)}

          Available puzzles:
          ${JSON.stringify(puzzlePool, null, 2)}

          Provide recommendations as JSON:
          {
            "puzzles": [{ "id": number, "score": number, "reason": string }],
            "next_difficulty": "easier" | "same" | "harder",
            "focus_areas": string[],
            "learning_path": {
              "current_level": string,
              "next_concepts": string[],
              "estimated_rating_potential": number
            }
          }`
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7, // Add some variability in recommendations
      });

      if (!response.choices[0].message.content) {
        throw new Error('No response content from OpenAI');
      }

      const recommendationData = JSON.parse(response.choices[0].message.content);
      const validatedData = recommendationResponseSchema.parse(recommendationData);

      // Enhanced puzzle selection with learning path consideration
      const recommendedPuzzles = this.processPuzzleRecommendations(
        validatedData,
        availablePuzzles,
        count
      );

      return {
        recommendations: recommendedPuzzles,
        nextDifficulty: validatedData.next_difficulty,
        focusAreas: validatedData.focus_areas,
        learningPath: validatedData.learning_path
      };

    } catch (error) {
      console.error('Error generating puzzle recommendations:', error);
      return this.getFallbackRecommendations(user, availablePuzzles, count);
    }
  }

  private analyzeUserPerformance(completedPuzzles: (Puzzle & { history: UserPuzzleHistory })[]) {
    const themePerformance = new Map<string, { attempts: number, successes: number }>();
    const timePerformance: { rating: number, timeSpent: number }[] = [];

    completedPuzzles.forEach(puzzle => {
      // Track theme performance
      puzzle.tacticalTheme?.forEach(theme => {
        const current = themePerformance.get(theme) || { attempts: 0, successes: 0 };
        current.attempts++;
        if (puzzle.history.completed) current.successes++;
        themePerformance.set(theme, current);
      });

      // Track time vs rating correlation
      if (puzzle.history.completed && puzzle.history.timeSpent) {
        timePerformance.push({
          rating: puzzle.rating,
          timeSpent: puzzle.history.timeSpent
        });
      }
    });

    return {
      themeSuccess: Object.fromEntries(
        Array.from(themePerformance.entries()).map(([theme, stats]) => [
          theme,
          stats.successes / stats.attempts
        ])
      ),
      timePerformance,
      totalPuzzles: completedPuzzles.length,
      recentPuzzles: completedPuzzles.slice(-10).map(p => ({
        rating: p.rating,
        success: p.history.completed,
        attempts: p.history.attempts
      }))
    };
  }

  private preparePuzzlePool(availablePuzzles: Puzzle[], completedPuzzles: (Puzzle & { history: UserPuzzleHistory })[]) {
    return availablePuzzles
      .filter(p => !completedPuzzles.some(cp => cp.id === p.id))
      .map(p => ({
        id: p.id,
        rating: p.rating,
        tacticalTheme: p.tacticalTheme,
        difficulty: p.difficulty,
        successRate: this.calculatePuzzleSuccessRate(p)
      }));
  }

  private calculatePuzzleSuccessRate(puzzle: Puzzle): number {
    if (!puzzle.totalAttempts) return 0;
    return (puzzle.successfulAttempts || 0) / puzzle.totalAttempts;
  }

  private processPuzzleRecommendations(
    validatedData: z.infer<typeof recommendationResponseSchema>,
    availablePuzzles: Puzzle[],
    count: number
  ) {
    return validatedData.puzzles
      .map(rec => ({
        puzzle: availablePuzzles.find(p => p.id === rec.id),
        score: rec.score,
        reason: rec.reason,
      }))
      .filter(rec => rec.puzzle)
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private getFallbackRecommendations(user: User, availablePuzzles: Puzzle[], count: number) {
    const targetRating = user.rating || 1200;
    const sortedPuzzles = availablePuzzles
      .map(puzzle => ({
        puzzle,
        score: 1 - Math.abs(puzzle.rating - targetRating) / 400,
        reason: "Rating appropriate for your current level"
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return {
      recommendations: sortedPuzzles,
      nextDifficulty: "same" as const,
      focusAreas: ["tactical vision", "calculation"],
      learningPath: {
        current_level: "intermediate",
        next_concepts: ["pattern recognition", "calculation depth"],
        estimated_rating_potential: targetRating + 200
      }
    };
  }
}