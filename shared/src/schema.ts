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
  email: varchar('email', { length: 255 }).notNull(),
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

// Rest of the schema remains the same...

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

// Rest of the file remains the same...
