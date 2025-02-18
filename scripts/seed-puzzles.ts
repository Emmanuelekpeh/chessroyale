import { insertPuzzleSchema, type InsertPuzzle } from "../shared/schema";
import { db } from "../server/db";
import { puzzles, users } from "../shared/schema";
import { eq } from "drizzle-orm";

const famousPuzzles = [
  {
    title: "First Steps - Capture",
    description: "Learn how to capture an undefended piece.",
    fen: "4k3/8/8/8/3p4/8/8/4K3 w - - 0 1",
    solution: "Kxd4",
    rating: "400",
    tacticalTheme: ["capture"],
    pieceTheme: ["king"],
    difficulty: "beginner" as const,
    isComputerGenerated: true,
    instructionalNotes: "If a piece is undefended (not protected by another piece), you can capture it safely."
  },
  {
    title: "Pawn Power",
    description: "Learn how pawns capture diagonally.",
    fen: "4k3/8/8/3p4/2P5/8/8/4K3 w - - 0 1",
    solution: "cxd5",
    rating: "300",
    tacticalTheme: ["capture"],
    pieceTheme: ["pawn"],
    difficulty: "beginner" as const,
    isComputerGenerated: true,
    instructionalNotes: "Pawns capture diagonally, one square forward-left or forward-right."
  },
  {
    title: "Basic Pin",
    description: "A straightforward pin that leads to material gain.",
    fen: "4k3/8/8/8/8/4b3/4Q3/4K3 w - - 0 1",
    solution: "Qxe3",
    rating: "500",
    tacticalTheme: ["pin"],
    pieceTheme: ["queen"],
    difficulty: "beginner" as const,
    isComputerGenerated: true,
    instructionalNotes: "When a piece can't move because it would expose a more valuable piece to capture, that's a pin."
  },
  {
    title: "Simple Checkmate",
    description: "Learn the basic back-rank checkmate.",
    fen: "4k3/4ppp1/8/8/8/8/8/4R1K1 w - - 0 1",
    solution: "Re8#",
    rating: "600",
    tacticalTheme: ["mate"],
    pieceTheme: ["rook"],
    difficulty: "beginner" as const,
    isComputerGenerated: true,
    instructionalNotes: "The opponent's pawns block their king's escape, making this a basic but important checkmate pattern."
  },
  {
    title: "Knight Fork Training",
    description: "Learn how to execute a simple knight fork.",
    fen: "4k3/8/8/8/4N3/8/8/4K1R1 w - - 0 1",
    solution: "Nd6+ Kf8 Nxg1",
    rating: "700",
    tacticalTheme: ["fork"],
    pieceTheme: ["knight"],
    difficulty: "beginner" as const,
    isComputerGenerated: true,
    instructionalNotes: "Look for the knight's L-shaped movement that can attack two pieces at once."
  },
  {
    title: "Discovered Attack",
    description: "An intermediate-level puzzle showing a discovered attack.",
    fen: "4k3/8/8/3B4/8/8/2N5/4K3 w - - 0 1",
    solution: "Ne3 Kd8 Bc6",
    rating: "900",
    tacticalTheme: ["discovery"],
    pieceTheme: ["knight", "bishop"],
    difficulty: "intermediate" as const,
    isComputerGenerated: true,
    instructionalNotes: "Moving one piece can reveal an attack from another - this is called a discovered attack."
  },
  {
    title: "Queen Sacrifice",
    description: "An advanced puzzle featuring a queen sacrifice.",
    fen: "r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/1B1P4/PqP2P2/2K4R b - - 0 1",
    solution: "Qxb3 axb3 Ra4",
    rating: "1100",
    tacticalTheme: ["sacrifice", "mate"],
    pieceTheme: ["queen", "rook"],
    difficulty: "advanced" as const,
    isComputerGenerated: false,
    sourceGame: "Based on Morphy vs Duke of Brunswick and Count Isouard (1858)",
    instructionalNotes: "Sometimes sacrificing material can lead to a winning position. Here, the queen sacrifice forces checkmate."
  },
  {
    title: "Double Attack",
    description: "Learn how to use a double attack to win material.",
    fen: "4k3/8/8/8/3q4/8/4P3/4K3 b - - 0 1",
    solution: "Qd3 Kf1 Qxe2+",
    rating: "800",
    tacticalTheme: ["doubleAttack"],
    pieceTheme: ["queen"],
    difficulty: "intermediate" as const,
    isComputerGenerated: true,
    instructionalNotes: "A double attack threatens two targets simultaneously, forcing the opponent to give up one of them."
  },
  {
    title: "Bishop Mate Pattern",
    description: "Learn a classic bishop checkmate pattern.",
    fen: "6k1/6P1/6K1/8/8/8/8/6B1 w - - 0 1",
    solution: "Bf2 Kh8 Bh4#",
    rating: "900",
    tacticalTheme: ["mate"],
    pieceTheme: ["bishop"],
    difficulty: "intermediate" as const,
    isComputerGenerated: true,
    instructionalNotes: "The bishop and pawn work together to force the king into a mating net."
  },
  {
    title: "Advanced Knight Fork",
    description: "A complex knight fork targeting multiple pieces.",
    fen: "4k2r/8/8/3N4/8/8/8/4K3 w - - 0 1",
    solution: "Nf6+ Kf8 Nxh7+",
    rating: "1000",
    tacticalTheme: ["fork"],
    pieceTheme: ["knight"],
    difficulty: "advanced" as const,
    isComputerGenerated: true,
    instructionalNotes: "Knights are especially dangerous in fork situations due to their unique movement pattern."
  }
];

async function seedPuzzles() {
  console.log("Starting puzzle seeding...");

  try {
    // Create system user for seeded puzzles if it doesn't exist
    const [systemUser] = await db.select().from(users).where(eq(users.username, 'system'));
    let systemUserId: number;

    if (!systemUser) {
      const [newSystemUser] = await db.insert(users).values({
        username: 'system',
        email: 'system@chesscrunch.com',
        password: 'not-used', // System user can't login
        rating: 2000,
        verifiedEmail: true,
        role: 'system'
      }).returning();
      systemUserId = newSystemUser.id;
      console.log('Created system user with ID:', systemUserId);
    } else {
      systemUserId = systemUser.id;
      console.log('Using existing system user with ID:', systemUserId);
    }

    // Insert each puzzle into the database
    for (const puzzle of famousPuzzles) {
      try {
        const [newPuzzle] = await db.insert(puzzles).values({
          ...puzzle,
          creatorId: systemUserId,
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageRatingDelta: 0,
          lastCalibrationAt: new Date(),
          verified: true, // These are pre-verified puzzles
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        console.log(`Created puzzle: ${puzzle.title} with ID: ${newPuzzle.id}`);
      } catch (error) {
        console.error(`Failed to create puzzle ${puzzle.title}:`, error);
      }
    }

    console.log("Puzzle seeding completed!");
  } catch (error) {
    console.error("Error during puzzle seeding:", error);
  }
}

seedPuzzles().catch(console.error);