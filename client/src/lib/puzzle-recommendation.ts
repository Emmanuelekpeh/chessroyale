import type { Puzzle, User, UserPuzzleHistory } from "@shared/schema";

interface PuzzleScore {
  puzzleId: number;
  attempts: number;
  successes: number;
  avgTimeToSolve: number | null;
  lastAttemptAt: Date | null;
}

interface PuzzleAnalytics {
  difficulty: number;
  completionRate: number;
  avgTimeToSolve: number;
  popularityScore: number;
  learningValue: number;  // New metric for educational value
  noviceAccessibility: number;  // How approachable for beginners
}

interface UserAnalytics {
  rating: number;
  preferredDifficulty: number;
  consistencyScore: number;
  learningRate: number;  // How quickly user improves
  strengthsByTheme: Record<string, number>;  // Performance in different tactical themes
  weaknessByPiece: Record<string, number>;   // Areas needing improvement by piece type
  optimalTimeOfDay: string;  // When user performs best
  streakLength: number;      // Current solving streak
}

function calculatePuzzleAnalytics(puzzle: Puzzle, userHistory: UserPuzzleHistory[]): PuzzleAnalytics {
  const puzzleAttempts = userHistory.filter(h => h.puzzleId === puzzle.id);

  if (puzzleAttempts.length === 0) {
    return {
      difficulty: Number(puzzle.rating),
      completionRate: 0,
      avgTimeToSolve: 0,
      popularityScore: 0,
      learningValue: calculateLearningValue(puzzle),
      noviceAccessibility: calculateNoviceAccessibility(puzzle)
    };
  }

  const completionRate = puzzleAttempts.reduce(
    (sum, attempt) => sum + (attempt.completed ? 1 : 0),
    0
  ) / puzzleAttempts.length;

  const avgTimeToSolve = puzzleAttempts.reduce(
    (sum, attempt) => sum + (attempt.timeSpent || 0),
    0
  ) / puzzleAttempts.length;

  // Weight difficulty based on completion rate and user rating
  const difficultyMultiplier = Math.max(0.5, Math.min(1.5, 1 - completionRate));
  const difficulty = Number(puzzle.rating) * difficultyMultiplier;

  // Calculate popularity with emphasis on educational value
  const mostRecentAttempt = new Date(Math.max(
    ...puzzleAttempts.map(a => a.lastAttemptAt?.getTime() || 0)
  ));
  const daysSinceLastAttempt = (new Date().getTime() - mostRecentAttempt.getTime()) / (1000 * 60 * 60 * 24);
  const popularityScore = (puzzleAttempts.length / Math.max(1, Math.sqrt(daysSinceLastAttempt))) *
    (Number(puzzle.rating) < 1000 ? 1.5 : 1);

  return {
    difficulty,
    completionRate,
    avgTimeToSolve,
    popularityScore,
    learningValue: calculateLearningValue(puzzle),
    noviceAccessibility: calculateNoviceAccessibility(puzzle)
  };
}

function calculateUserStrength(user: User, history: UserPuzzleHistory[]): UserAnalytics {
  if (history.length === 0) {
    return {
      rating: user.rating || 800,
      preferredDifficulty: user.rating || 800,
      consistencyScore: 1,
      learningRate: 1,
      strengthsByTheme: {},
      weaknessByPiece: {},
      optimalTimeOfDay: "any",
      streakLength: 0
    };
  }

  // Calculate theme-based performance
  const themePerformance: Record<string, { successes: number; attempts: number }> = {};
  const piecePerformance: Record<string, { successes: number; attempts: number }> = {};

  history.forEach(attempt => {
    const puzzle = puzzles.find(p => p.id === attempt.puzzleId);
    if (!puzzle) return;

    puzzle.tacticalTheme.forEach(theme => {
      if (!themePerformance[theme]) {
        themePerformance[theme] = { successes: 0, attempts: 0 };
      }
      themePerformance[theme].successes += attempt.successes;
      themePerformance[theme].attempts += attempt.attempts;
    });

    puzzle.pieceTheme.forEach(piece => {
      if (!piecePerformance[piece]) {
        piecePerformance[piece] = { successes: 0, attempts: 0 };
      }
      piecePerformance[piece].successes += attempt.successes;
      piecePerformance[piece].attempts += attempt.attempts;
    });
  });

  // Calculate success rates with more weight on recent attempts
  const successRates = history.map(h => ({
    rate: h.successes / Math.max(1, h.attempts),
    timestamp: h.lastAttemptAt,
    timeOfDay: h.lastAttemptAt ? new Date(h.lastAttemptAt).getHours() : 12
  })).sort((a, b) => 
    (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
  );

  // Calculate learning rate from progression of success rates
  const learningRate = successRates.reduce((rate, curr, idx, arr) => {
    if (idx === 0) return rate;
    const improvement = curr.rate - arr[idx - 1].rate;
    return rate + (improvement > 0 ? improvement : 0);
  }, 1) / successRates.length;

  // Find optimal time of day for solving
  const timePerformance = Array(24).fill(0).map((_, hour) => ({
    hour,
    success: successRates.filter(r => r.timeOfDay === hour).reduce((sum, r) => sum + r.rate, 0)
  }));
  const bestHour = timePerformance.reduce((best, curr) => 
    curr.success > best.success ? curr : best
  );

  // Calculate streak
  let streakLength = 0;
  const today = new Date().setHours(0, 0, 0, 0);
  for (const attempt of successRates) {
    if (!attempt.timestamp || 
        attempt.timestamp.setHours(0, 0, 0, 0) !== today - streakLength * 86400000) break;
    streakLength++;
  }

  // Recent performance has more weight
  const recentSuccessRate = successRates
    .slice(0, 10)
    .reduce((sum, { rate }, i) => sum + rate * (1 - i * 0.1), 0) / Math.min(10, successRates.length);

  // Calculate consistency score
  const consistencyScore = 1 - Math.sqrt(
    successRates.reduce((variance, { rate }) => 
      variance + Math.pow(rate - recentSuccessRate, 2), 0
    ) / successRates.length
  );

  // Adjust preferred difficulty based on recent performance and learning rate
  const preferredDifficulty = Math.max(
    500,
    user.rating * (0.8 + recentSuccessRate * 0.4) * (1 + learningRate * 0.2)
  );

  return {
    rating: user.rating,
    preferredDifficulty,
    consistencyScore,
    learningRate,
    strengthsByTheme: Object.fromEntries(
      Object.entries(themePerformance).map(([theme, perf]) => 
        [theme, perf.successes / Math.max(1, perf.attempts)]
      )
    ),
    weaknessByPiece: Object.fromEntries(
      Object.entries(piecePerformance).map(([piece, perf]) => 
        [piece, 1 - (perf.successes / Math.max(1, perf.attempts))]
      )
    ),
    optimalTimeOfDay: `${bestHour.hour}:00`,
    streakLength
  };
}

function calculateLearningValue(puzzle: Puzzle): number {
  // Higher value for puzzles that teach fundamental concepts
  const fundamentalThemes = ['pin', 'fork', 'discovery', 'mate'];
  const themeValue = puzzle.tacticalTheme.reduce((sum, theme) => 
    sum + (fundamentalThemes.includes(theme) ? 1.5 : 1), 0
  );

  // Value instructional content
  const hasInstructions = puzzle.instructionalNotes ? 1.2 : 1;

  // Prefer shorter, focused puzzles for learning
  const solutionLength = puzzle.solution.split(' ').length;
  const complexityFactor = 1 / Math.sqrt(solutionLength);

  return themeValue * hasInstructions * complexityFactor;
}

function calculateNoviceAccessibility(puzzle: Puzzle): number {
  // Factors that make a puzzle more accessible
  const isBasicMate = puzzle.tacticalTheme.includes('mate') && puzzle.solution.includes('#');
  const isSingleMove = puzzle.solution.split(' ').length === 1;
  const hasBasicPieces = puzzle.pieceTheme.every(p => ['queen', 'rook', 'knight'].includes(p));
  const isLowRated = Number(puzzle.rating) < 1000;

  return (isBasicMate ? 1.5 : 1) *
         (isSingleMove ? 1.3 : 1) *
         (hasBasicPieces ? 1.2 : 1) *
         (isLowRated ? 1.4 : 1);
}

export function recommendPuzzles(
  user: User,
  puzzles: Puzzle[],
  userHistory: UserPuzzleHistory[],
  count: number = 5
): Puzzle[] {
  const userStrength = calculateUserStrength(user, userHistory);

  // Filter out puzzles the user has mastered
  const unsolvedPuzzles = puzzles.filter(puzzle => {
    const attempts = userHistory.find(h => h.puzzleId === puzzle.id);
    return !attempts || attempts.successes / attempts.attempts < 0.8;
  });

  // Score each puzzle based on multiple factors
  const scoredPuzzles = unsolvedPuzzles.map(puzzle => {
    const analytics = calculatePuzzleAnalytics(puzzle, userHistory);

    // Calculate distance from preferred difficulty
    const difficultyMatch = 1 / (1 + Math.abs(analytics.difficulty - userStrength.preferredDifficulty));

    // Boost score for themes/pieces where user needs practice
    const themeBoost = puzzle.tacticalTheme.reduce((boost, theme) => 
      boost + (1 - (userStrength.strengthsByTheme[theme] || 0.5)), 0
    ) / puzzle.tacticalTheme.length;

    const pieceBoost = puzzle.pieceTheme.reduce((boost, piece) => 
      boost + (userStrength.weaknessByPiece[piece] || 0.5), 0
    ) / puzzle.pieceTheme.length;

    // Learning progression factors
    const learningBonus = analytics.learningValue * 
      (userStrength.rating < 1000 ? analytics.noviceAccessibility : 1);

    // Combined score with dynamic weights
    const score = (
      difficultyMatch * 0.3 +
      themeBoost * 0.2 +
      pieceBoost * 0.2 +
      learningBonus * 0.3
    ) * userStrength.consistencyScore;

    return { puzzle, score };
  });

  // Sort by score and ensure variety in themes
  return diversifySelection(
    scoredPuzzles.sort((a, b) => b.score - a.score),
    count,
    userStrength
  );
}

function diversifySelection(
  scoredPuzzles: Array<{ puzzle: Puzzle; score: number }>,
  count: number,
  userStrength: UserAnalytics
): Puzzle[] {
  const selected: Puzzle[] = [];
  const usedThemes = new Set<string>();

  while (selected.length < count && scoredPuzzles.length > 0) {
    // Find the highest-scoring puzzle that introduces a new theme
    const index = scoredPuzzles.findIndex(({ puzzle }) => 
      puzzle.tacticalTheme.some(theme => !usedThemes.has(theme))
    );

    if (index === -1) {
      // If no new themes available, just take the highest scoring remaining puzzle
      selected.push(scoredPuzzles[0].puzzle);
      scoredPuzzles.shift();
    } else {
      const { puzzle } = scoredPuzzles[index];
      selected.push(puzzle);
      puzzle.tacticalTheme.forEach(theme => usedThemes.add(theme));
      scoredPuzzles.splice(index, 1);
    }
  }

  return selected;
}