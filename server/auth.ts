import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Request, Response, NextFunction } from 'express';
import session from "express-session";
import { storage } from './storage';
import { db } from './db';
import { users } from '@shared/schema';
import { SessionData } from 'express-session';
import MemoryStore from 'memorystore';

// Add type declarations for session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    passport?: {
      user?: number;
    };
  }
}

// Configure passport local strategy
passport.use(
  new LocalStrategy(
    async (username: string, password: string, done: (error: any, user?: any) => void) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        const isValidPassword = await storage.validateUserPassword(
          username,
          password
        );

        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: any, done: (err: any, id?: number) => void) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Login handler
export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  passport.authenticate("local", (err: any, user: any) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Session error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      return res.json({ user });
    });
  })(req, res, next);
}

// Registration handler
export async function handleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    const existingUser = await storage.getUserByUsername(username);

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const user = await storage.createUser({ username, password });
    
    req.logIn(user, (err) => {
      if (err) {
        console.error("Session error:", err);
        return res.status(500).json({ error: "Session error" });
      }
      return res.json({ user });
    });
  } catch (error) {
    next(error);
  }
}

// Logout handler
export function handleLogout(req: Request, res: Response) {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
}

// Get current user handler
export function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

// Session configuration
export const sessionConfig = {
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}; 