import { storage } from '../server/storage';
import { db } from '../server/db';
import { puzzles, users, achievements } from '../shared/schema';

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Initial Users
    const sampleUsers = [
      {
        username: 'GrandMaster1',
        rating: 2200,
        gamesPlayed: 150,
        gamesWon: 95,
        puzzlesSolved: 500,
        score: 2500,
        currentStreak: 7,
        bestStreak: 15,
        totalPoints: 25000,
        level: 25,
        isGuest: false
      },
      {
        username: 'ChessLearner',
        rating: 1400,
        gamesPlayed: 50,
        gamesWon: 23,
        puzzlesSolved: 200,
        score: 1000,
        currentStreak: 3,
        bestStreak: 5,
        totalPoints: 8000,
        level: 10,
        isGuest: false
      },
      {
        username: 'TacticsKing',
        rating: 1800,
        gamesPlayed: 300,
        gamesWon: 175,
        puzzlesSolved: 1000,
        score: 5000,
        currentStreak: 12,
        bestStreak: 20,
        totalPoints: 50000,
        level: 40,
        isGuest: false
      }
    ];

    console.log('Creating sample users...');
    for (const user of sampleUsers) {
      await storage.createUser(user);
    }

    // Initial Puzzles with Various Themes and Difficulties
    const samplePuzzles = [
      {
        creatorId: 1,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        solution: 'Ng5',
        title: 'Double Attack with Knight',
        description: 'Find the knight move that attacks two pieces simultaneously',
        rating: 1400,
        tacticalTheme: ['fork', 'double attack'],
        difficulty: 'intermediate',
        verified: true,
        hintsAvailable: 2,
        pointValue: 25,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageTimeToSolve: 0
      },
      {
        creatorId: 1,
        fen: 'r3k2r/ppp2ppp/2n1b3/2b1P3/3p4/3B1N2/PPP2PPP/R3K2R w KQkq - 0 1',
        solution: 'Bxh7+',
        title: 'Greek Gift Sacrifice',
        description: 'Classic bishop sacrifice on h7 leading to a mating attack',
        rating: 1800,
        tacticalTheme: ['sacrifice', 'mating attack'],
        difficulty: 'advanced',
        verified: true,
        hintsAvailable: 1,
        pointValue: 35,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageTimeToSolve: 0
      },
      {
        creatorId: 1,
        fen: '2r3k1/pp3pp1/2n4p/q7/3N4/2P1B3/PP3PPP/R2Q2K1 w - - 0 1',
        solution: 'Nf5',
        title: 'Knight Fork Practice',
        description: 'Find the knight fork that wins material',
        rating: 1200,
        tacticalTheme: ['fork'],
        difficulty: 'beginner',
        verified: true,
        hintsAvailable: 3,
        pointValue: 15,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageTimeToSolve: 0
      },
      {
        creatorId: 1,
        fen: '4r1k1/ppp2ppp/8/4P3/1bP5/2N5/PP4PP/R3K2R w KQ - 0 1',
        solution: 'Nd5',
        title: 'Discovered Attack',
        description: 'Use the knight to create a discovered attack on the rook',
        rating: 1600,
        tacticalTheme: ['discovered attack'],
        difficulty: 'intermediate',
        verified: true,
        hintsAvailable: 2,
        pointValue: 30,
        totalAttempts: 0,
        successfulAttempts: 0,
        averageTimeToSolve: 0
      }
    ];

    console.log('Creating sample puzzles...');
    for (const puzzle of samplePuzzles) {
      await storage.createPuzzle(puzzle);
    }

    // Initial Achievements
    const sampleAchievements = [
      {
        name: 'Puzzle Master',
        description: 'Solve 100 puzzles',
        type: 'puzzles_solved',
        requiredValue: 100,
        pointReward: 500
      },
      {
        name: 'Rating Milestone',
        description: 'Reach a rating of 1500',
        type: 'rating',
        requiredValue: 1500,
        pointReward: 1000
      },
      {
        name: 'Consistency King',
        description: 'Achieve a 7-day streak',
        type: 'streak',
        requiredValue: 7,
        pointReward: 300
      },
      {
        name: 'Elite Tactician',
        description: 'Accumulate 10000 total points',
        type: 'total_points',
        requiredValue: 10000,
        pointReward: 2000
      }
    ];

    console.log('Creating achievements...');
    await db.insert(achievements).values(sampleAchievements);

    // Add some sample puzzle history
    console.log('Creating sample puzzle history...');
    const users = await db.select().from(users);
    const puzzles = await db.select().from(puzzles);

    for (const user of users.slice(0, 2)) {
      for (const puzzle of puzzles.slice(0, 2)) {
        await storage.updatePuzzleHistory({
          userId: user.id,
          puzzleId: puzzle.id,
          completed: true,
          timeSpent: Math.floor(Math.random() * 180) + 60, // 60-240 seconds
          attempts: Math.floor(Math.random() * 3) + 1,
          hintsUsed: Math.floor(Math.random() * 2),
          pointsEarned: puzzle.pointValue
        });
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Execute the seed function
seed()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
