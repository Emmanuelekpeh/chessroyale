import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPuzzleSchema } from "../shared/schema";
import { db } from "./db";
import { PuzzleGenerator } from './services/puzzle-generator';
import { ChessApiService } from './services/chess-api';
import { PuzzleRecommender } from './services/puzzle-recommender';

// Initialize ChessApiService
const chessApiService = new ChessApiService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Register all routes first
  app.post("/api/users", async (req, res) => {
    try {
      console.log("Creating new user with data:", req.body);
      const user = await storage.createUser({
        ...req.body,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        puzzlesSolved: 0,
        score: 0
      });

      console.log("Created user:", user);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Puzzle routes
  app.get("/api/puzzles", async (req, res) => {
    try {
      console.log('Fetching puzzles with query params:', req.query);
      const verified = req.query.verified ? req.query.verified === 'true' : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const puzzles = await storage.getPuzzles(verified);
      if (!puzzles || !Array.isArray(puzzles)) {
        throw new Error('Invalid puzzle data received from storage');
      }

      const startIndex = (page - 1) * pageSize;
      const paginatedPuzzles = puzzles.slice(startIndex, startIndex + pageSize);

      console.log(`Found ${paginatedPuzzles.length} puzzles for page ${page}`);
      res.json(paginatedPuzzles);
    } catch (error: unknown) {
      console.error('Error fetching puzzles:', error);
      const err = error as Error & { status?: number; code?: string };
      const status = err.status || 500;
      const message = err.message || 'Failed to fetch puzzles';
      res.status(status).json({
        error: {
          message,
          code: err.code || 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
      });
    }
  });

  app.get("/api/puzzles/:id", async (req, res) => {
    try {
      console.log(`Fetching puzzle with id: ${req.params.id}`);
      const puzzleId = parseInt(req.params.id);
      if (isNaN(puzzleId)) {
        return res.status(400).json({ error: "Invalid puzzle ID" });
      }

      const puzzle = await storage.getPuzzle(puzzleId);
      if (!puzzle) {
        console.log(`No puzzle found with id: ${puzzleId}`);
        return res.status(404).json({ error: "Puzzle not found" });
      }
      console.log('Found puzzle:', puzzle);
      res.json(puzzle);
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle' });
    }
  });

  app.post("/api/puzzles", async (req, res) => {
    try {
      const puzzle = insertPuzzleSchema.parse({
        ...req.body,
        creatorId: req.body.creatorId, // Assuming creatorId is now part of req.body
      });
      const created = await storage.createPuzzle(puzzle);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating puzzle:', error);
      res.status(500).json({ error: 'Failed to create puzzle' });
    }
  });


  app.post("/api/puzzles/:id/verify", async (req, res) => {
    const puzzleId = parseInt(req.params.id);
    if (isNaN(puzzleId)) {
      return res.status(400).json({ error: "Invalid puzzle ID format" });
    }

    try {
      const puzzle = await storage.verifyPuzzle(puzzleId);
      if (!puzzle) {
        return res.status(404).json({ error: "Puzzle not found" });
      }
      res.json(puzzle);
    } catch (error) {
      console.error('Error verifying puzzle:', error);
      res.status(500).json({ error: "Failed to verify puzzle" });
    }
  });

  app.get("/api/puzzles/recommended", async (req, res) => {
    const count = req.query.count ? parseInt(req.query.count as string) : undefined;
    const puzzles = await storage.getRecommendedPuzzles(req.body.userId, count); // Assuming userId is passed in the body
    res.json(puzzles);
  });

  app.post("/api/puzzles/:id/attempt", async (req, res) => {
    try {
      const history = await storage.updatePuzzleHistory({
        userId: req.body.userId, // Assuming userId is passed in the body
        puzzleId: Number(req.params.id),
        attempts: req.body.attempts,
        hintsUsed: req.body.hintsUsed,
        completed: req.body.completed,
        timeSpent: req.body.timeSpent,
        rating: req.body.rating
      });

      res.json(history);
    } catch (error) {
      console.error('Error updating puzzle history:', error);
      res.status(500).json({ error: 'Failed to update puzzle history' });
    }
  });

  app.get("/api/users/:id/puzzle-history", async (req, res) => {
    try {
      const history = await storage.getUserPuzzleHistory(Number(req.params.id));
      res.json(history);
    } catch (error) {
      console.error('Error fetching puzzle history:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle history' });
    }
  });

  // Add new routes for puzzle calibration
  app.post("/api/puzzles/:id/calibrate", async (req, res) => {
    try {
      const puzzleId = parseInt(req.params.id);
      if (isNaN(puzzleId)) {
        return res.status(400).json({ error: "Invalid puzzle ID" });
      }

      const updatedPuzzle = await storage.recalibratePuzzleDifficulty(puzzleId);
      res.json(updatedPuzzle);
    } catch (error) {
      console.error('Error calibrating puzzle:', error);
      res.status(500).json({ error: 'Failed to calibrate puzzle' });
    }
  });

  app.get("/api/puzzles/:id/metrics", async (req, res) => {
    try {
      const puzzleId = parseInt(req.params.id);
      if (isNaN(puzzleId)) {
        return res.status(400).json({ error: "Invalid puzzle ID" });
      }

      const puzzle = await storage.getPuzzle(puzzleId);
      if (!puzzle) return res.sendStatus(404);

      const metrics = {
        rating: puzzle.rating,
        totalAttempts: puzzle.totalAttempts,
        successfulAttempts: puzzle.successfulAttempts,
        successRate: puzzle.totalAttempts ?
          (puzzle.successfulAttempts! / puzzle.totalAttempts * 100).toFixed(1) : 0,
        averageTimeToSolve: puzzle.averageTimeToSolve,
        averageRatingDelta: puzzle.averageRatingDelta,
        lastCalibrationAt: puzzle.lastCalibrationAt,
      };

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching puzzle metrics:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle metrics' });
    }
  });

  // Add after the puzzle metrics endpoint
  app.get("/api/puzzles/:id/rating-history", async (req, res) => {
    try {
      const puzzleId = parseInt(req.params.id);
      if (isNaN(puzzleId)) {
        return res.status(400).json({ error: "Invalid puzzle ID" });
      }

      const puzzle = await storage.getPuzzle(puzzleId);
      if (!puzzle) return res.sendStatus(404);

      const ratingHistory = await storage.getPuzzleRatingHistory(puzzleId);

      const history = ratingHistory.map(record => ({
        oldRating: record.oldRating,
        newRating: record.newRating,
        ratingChange: record.ratingChange,
        successRate: record.successRate,
        averageTimeToSolve: record.averageTimeToSolve,
        calibratedAt: record.calibratedAt,
      }));

      res.json(history);
    } catch (error) {
      console.error('Error fetching puzzle rating history:', error);
      res.status(500).json({ error: 'Failed to fetch puzzle rating history' });
    }
  });

  // Add new route for generating puzzles
  app.post("/api/puzzles/generate", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 10;
      const generator = new PuzzleGenerator();

      // Start the generation process
      await generator.generateBatch(count);
      generator.cleanup();

      res.json({ message: `Started generating ${count} puzzles` });
    } catch (error) {
      console.error('Error initiating puzzle generation:', error);
      res.status(500).json({ error: 'Failed to generate puzzles' });
    }
  });


  // Import puzzles from Lichess
  app.post("/api/lichess/import-puzzles", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 10;
      const puzzles = await chessApiService.importPuzzlesFromLichess(count);

      // Save imported puzzles to our database
      for (const puzzle of puzzles) {
        await storage.createPuzzle({
          title: puzzle.isDaily ? "Daily Lichess Puzzle" : "Lichess Puzzle",
          description: `Imported from Lichess. Themes: ${puzzle.themes.join(", ")}`,
          fen: puzzle.fen,
          solution: puzzle.solution,
          rating: puzzle.rating,
          difficulty: puzzle.rating < 1500 ? "beginner" :
                     puzzle.rating < 2000 ? "intermediate" : "advanced",
          tacticalTheme: puzzle.themes,
          creatorId: req.body.creatorId,
          verified: true,
        });
      }

      res.json(puzzles);
    } catch (error: unknown) {
      console.error('Error importing Lichess puzzles:', error);
      res.status(500).json({ error: 'Failed to import Lichess puzzles' });
    }
  });

  // Create study from puzzles
  app.post("/api/lichess/create-study", async (req, res) => {
    try {
      const { title, puzzleIds } = req.body;

      // Fetch puzzles from our database
      const puzzles = await Promise.all(
        puzzleIds.map((id: number) => storage.getPuzzle(id))
      );

      // Create study on Lichess
      const study = await chessApiService.createStudyFromPuzzles(
        title,
        puzzles.filter(Boolean).map(puzzle => ({
          fen: puzzle.fen,
          solution: puzzle.solution
        }))
      );

      res.json(study);
    } catch (error) {
      console.error('Error creating Lichess study:', error);
      res.status(500).json({ error: 'Failed to create Lichess study' });
    }
  });

  // Initialize puzzle recommender
  const puzzleRecommender = new PuzzleRecommender();

  app.get("/api/puzzles/personalized-recommendations", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      const user = await storage.getUser(req.body.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's completed puzzles with history
      const puzzleHistory = await storage.getUserPuzzleHistory(user.id);
      const completedPuzzles = await Promise.all(
        puzzleHistory.map(async history => ({
          ...(await storage.getPuzzle(history.puzzleId))!,
          history,
        }))
      );

      // Get available puzzles
      const availablePuzzles = await storage.getPuzzles(true);

      // Generate recommendations
      const recommendations = await puzzleRecommender.generateRecommendations(
        user,
        completedPuzzles.filter(Boolean) as any[],
        availablePuzzles,
        count
      );

      // Track user engagement with recommendations
      await storage.updateUserStats(user.id, {
        lastRecommendationAt: new Date(),
        recommendationCount: (user.recommendationCount || 0) + 1
      });

      res.json({
        ...recommendations,
        userProgress: {
          rating: user.rating,
          puzzlesSolved: user.puzzlesSolved,
          currentStreak: user.currentStreak,
          level: user.level
        }
      });
    } catch (error) {
      console.error('Error generating puzzle recommendations:', error);
      res.status(500).json({ error: 'Failed to generate puzzle recommendations' });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}