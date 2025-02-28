import { z } from 'zod';
import { pgTable, serial, text, integer, boolean, varchar, array } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// ---- Drizzle Schema Definitions ----
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 30 }).notNull(),
  rating: integer('rating').notNull().default(1200),
  gamesPlayed: integer('games_played').notNull().default(0),
  gamesWon: integer('games_won').notNull().default(0),
  puzzlesSolved: integer('puzzles_solved').notNull().default(0),
  score: integer('score').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  level: integer('level').notNull().default(1),
  isGuest: boolean('is_guest').notNull().default(false)
});

export const puzzles = pgTable('puzzles', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').notNull(),
  fen: text('fen').notNull(),
  solution: text('solution').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  rating: integer('rating').notNull(),
  tacticalTheme: array('tactical_theme').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  verified: boolean('verified').notNull().default(false),
  hintsAvailable: integer('hints_available').notNull(),
  pointValue: integer('point_value').notNull(),
  totalAttempts: integer('total_attempts').notNull().default(0),
  successfulAttempts: integer('successful_attempts').notNull().default(0),
  averageTimeToSolve: integer('average_time_to_solve').notNull().default(0)
});

// ---- Zod Schemas (keep your existing ones) ----
export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3).max(30),
  rating: z.number().min(0).default(1200),
  gamesPlayed: z.number().min(0).default(0),
  gamesWon: z.number().min(0).default(0),
  puzzlesSolved: z.number().min(0).default(0),
  score: z.number().min(0).default(0),
  currentStreak: z.number().min(0).default(0),
  bestStreak: z.number().min(0).default(0),
  totalPoints: z.number().min(0).default(0),
  level: z.number().min(0).default(1),
  isGuest: z.boolean().default(false)
});

export const puzzleSchema = z.object({
  id: z.number().optional(),
  creatorId: z.number(),
  fen: z.string(),
  solution: z.string(),
  title: z.string(),
  description: z.string(),
  rating: z.number().min(0),
  tacticalTheme: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  verified: z.boolean(),
  hintsAvailable: z.number().min(0),
  pointValue: z.number().min(0),
  totalAttempts: z.number().min(0),
  successfulAttempts: z.number().min(0),
  averageTimeToSolve: z.number().min(0)
});

// ---- Drizzle-Zod Integration ----
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertPuzzleSchema = createInsertSchema(puzzles);
export const selectPuzzleSchema = createSelectSchema(puzzles);

// Types
export type User = z.infer<typeof userSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;

// Database Types
export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

export type DbPuzzle = typeof puzzles.$inferSelect;
export type NewDbPuzzle = typeof puzzles.$inferInsert;
