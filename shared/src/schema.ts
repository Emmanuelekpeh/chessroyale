import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Keep essential user-related types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Puzzle = typeof puzzles.$inferSelect;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;
export type UserPuzzleHistory = typeof userPuzzleHistory.$inferSelect;
export type InsertUserPuzzleHistory = z.infer<typeof insertUserPuzzleHistorySchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type PuzzleRatingHistory = typeof puzzleRatingHistory.$inferSelect;
export type InsertPuzzleRatingHistory = z.infer<typeof insertPuzzleRatingHistorySchema>;
export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = z.infer<typeof insertTutorialSchema>;
export type Game = typeof games.$inferSelect;

// Simplified users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").default('CHANGE_PASSWORD'), // Add with default
  rating: integer("rating").default(1200),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  puzzlesSolved: integer("puzzles_solved").default(0),
  score: integer("score").default(0),
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  totalPoints: integer("total_points").default(0),
  level: integer("level").default(1),
  isGuest: boolean("is_guest").default(false),
  // New fields for tracking recommendations
  lastRecommendationAt: timestamp("last_recommendation_at"),
  recommendationCount: integer("recommendation_count").default(0),
  // New fields for learning progress
  strongestThemes: text("strongest_themes").array(),
  weakestThemes: text("weakest_themes").array(),
  lastActiveAt: timestamp("last_active_at"),
  learningGoals: text("learning_goals").array(),
});

export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  fen: text("fen").notNull(),
  solution: text("solution").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tacticalTheme: text("tactical_theme").array(),
  difficulty: text("difficulty").default('beginner'),
  verified: boolean("verified").default(false),
  hintsAvailable: integer("hints_available").default(0),
  pointValue: integer("point_value").default(10),
  totalAttempts: integer("total_attempts").default(0),
  successfulAttempts: integer("successful_attempts").default(0),
  averageTimeToSolve: integer("average_time_to_solve").default(0),
  averageRatingDelta: integer("average_rating_delta").default(0),
  lastCalibrationAt: timestamp("last_calibration_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPuzzleHistory = pgTable("user_puzzle_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  puzzleId: integer("puzzle_id").notNull().references(() => puzzles.id),
  attempts: integer("attempts").default(0),
  hintsUsed: integer("hints_used").default(0),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent").default(0),
  rating: integer("rating"),
  pointsEarned: integer("points_earned").default(0),
  streakCount: integer("streak_count").default(0),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  requiredValue: integer("required_value").notNull(),
  pointReward: integer("point_reward").notNull(),
  iconName: text("icon_name").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").default(0),
  currentTier: integer("current_tier").default(1),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  hintType: text("hint_type").default('visual'),
  boardTheme: text("board_theme").default('green'),
  boardOrientation: text("board_orientation").default('white'),
  soundEnabled: boolean("sound_enabled").default(true),
  showScoreboard: boolean("show_scoreboard").default(true),
  showAchievements: boolean("show_achievements").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userPuzzleRelations = relations(userPuzzleHistory, ({ one }) => ({
  user: one(users, {
    fields: [userPuzzleHistory.userId],
    references: [users.id],
  }),
  puzzle: one(puzzles, {
    fields: [userPuzzleHistory.puzzleId],
    references: [puzzles.id],
  }),
}));

export const achievementRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// Simplified insert schema for users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  rating: true,
  gamesPlayed: true,
  gamesWon: true,
  puzzlesSolved: true,
  score: true,
  isGuest: true,
  lastRecommendationAt: true,
  recommendationCount: true,
  strongestThemes: true,
  weakestThemes: true,
  lastActiveAt: true,
  learningGoals: true,
});

export const insertPuzzleSchema = createInsertSchema(puzzles).omit({
  id: true,
  createdAt: true,
  lastCalibrationAt: true,
  totalAttempts: true,
  successfulAttempts: true,
  averageTimeToSolve: true,
  averageRatingDelta: true,
});

export const insertUserPuzzleHistorySchema = createInsertSchema(userPuzzleHistory).omit({
  id: true,
  lastAttemptAt: true,
  pointsEarned: true,
  streakCount: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

// Add FriendRequest related schema
export const friendRequests = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  sender: one(users, {
    fields: [friendRequests.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [friendRequests.receiverId],
    references: [users.id],
  }),
}));

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(),
  activityData: text("activity_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

// Add after the userActivities table definition
export const puzzleRatingHistory = pgTable("puzzle_rating_history", {
  id: serial("id").primaryKey(),
  puzzleId: integer("puzzle_id").notNull().references(() => puzzles.id),
  oldRating: integer("old_rating").notNull(),
  newRating: integer("new_rating").notNull(),
  ratingChange: integer("rating_change").notNull(),
  totalAttempts: integer("total_attempts").notNull(),
  successRate: integer("success_rate").notNull(),
  averageTimeToSolve: integer("average_time_to_solve").notNull(),
  calibratedAt: timestamp("calibrated_at").defaultNow(),
});

export const puzzleRatingHistoryRelations = relations(puzzleRatingHistory, ({ one }) => ({
  puzzle: one(puzzles, {
    fields: [puzzleRatingHistory.puzzleId],
    references: [puzzles.id],
  }),
}));

export const insertPuzzleRatingHistorySchema = createInsertSchema(puzzleRatingHistory).omit({
  id: true,
  calibratedAt: true,
});

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'puzzles_solved' | 'rating_reached' | 'daily_streak' | 'themes_mastered';
    threshold: number;
  };
};

export type UserAchievement = {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
};

// Add new types for Game and Tutorial functionality
export const tutorials = pgTable("tutorials", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").default('beginner'),
  steps: text("steps").array(),
  fens: text("fens").array(),
  solutions: text("solutions").array(),
  rating: integer("rating").default(1200),
  pointValue: integer("point_value").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  currentPosition: text("current_position").notNull(),
  solution: text("solution").notNull(),
  puzzleRating: integer("puzzle_rating").default(1200).notNull(),
  status: text("status").default('pending').notNull(),
  winnerId: integer("winner_id").references(() => users.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  lastMove: text("last_move"),
  lastMoveBy: integer("last_move_by").references(() => users.id),
  movesPlayed: text("moves_played").array(),
  player1Score: integer("player1_score").default(0),
  player2Score: integer("player2_score").default(0),
});

export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  pointValue: true,
  rating: true,
});
