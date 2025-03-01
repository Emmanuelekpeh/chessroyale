import { z } from 'zod';
import { pgTable, serial, text, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { User, Puzzle, Achievement } from '@/types';
import type { GameState, ChatMessage } from '@/types/game';

// Database Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 30 }).notNull(),
  // Add these two fields:
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }), 
  // Existing fields:
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
  creatorId: integer('creator_id')
    .notNull()
    .references(() => users.id),
  fen: text('fen').notNull(),
  solution: text('solution').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  rating: integer('rating').notNull(),
  tacticalTheme: text('tactical_theme').array().notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  verified: boolean('verified').notNull().default(false),
  hintsAvailable: integer('hints_available').notNull(),
  pointValue: integer('point_value').notNull(),
  totalAttempts: integer('total_attempts').notNull().default(0),
  successfulAttempts: integer('successful_attempts').notNull().default(0),
  averageTimeToSolve: integer('average_time_to_solve').notNull().default(0)
});

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  requiredValue: integer('required_value').notNull(),
  pointReward: integer('point_reward').notNull()
});

export const games = pgTable('games', {
  id: varchar('id', { length: 36 }).primaryKey(),
  fen: text('fen').notNull(),
  whitePlayer: integer('white_player').references(() => users.id),
  blackPlayer: integer('black_player').references(() => users.id),
  timeControlInitial: integer('time_control_initial').notNull(),
  timeControlIncrement: integer('time_control_increment').notNull(),
  moves: text('moves').array().notNull().default([]),
  status: varchar('status', { length: 20 }).notNull(),
  winner: varchar('winner', { length: 20 }),
  startedAt: integer('started_at').notNull()
});

// Update Zod Schema to match
export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3).max(30),
  // Add these two fields:
  passwordHash: z.string(),
  email: z.string().email(),
  // Existing fields:
  rating: z.number().default(1200),
  gamesPlayed: z.number().default(0),
  gamesWon: z.number().default(0),
  puzzlesSolved: z.number().default(0),
  score: z.number().default(0),
  currentStreak: z.number().default(0),
  bestStreak: z.number().default(0),
  totalPoints: z.number().default(0),
  level: z.number().default(1),
  isGuest: z.boolean().default(false)
}) as z.ZodType<User>;


export const puzzleSchema = z.object({
  id: z.number().optional(),
  creatorId: z.number(),
  fen: z.string(),
  solution: z.string(),
  title: z.string().max(255),
  description: z.string(),
  rating: z.number(),
  tacticalTheme: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  verified: z.boolean().default(false),
  hintsAvailable: z.number(),
  pointValue: z.number(),
  totalAttempts: z.number().default(0),
  successfulAttempts: z.number().default(0),
  averageTimeToSolve: z.number().default(0)
}) as z.ZodType<Puzzle>;

// Export types
export type DbUser = typeof users.$inferSelect;
export type NewDbUser = typeof users.$inferInsert;

export type DbPuzzle = typeof puzzles.$inferSelect;
export type NewDbPuzzle = typeof puzzles.$inferInsert;

export type DbAchievement = typeof achievements.$inferSelect;
export type NewDbAchievement = typeof achievements.$inferInsert;

export type DbGame = typeof games.$inferSelect;
export type NewDbGame = typeof games.$inferInsert;
