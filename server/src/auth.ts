import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { Store } from "express-session";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStoreSession = MemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null) {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn("No SESSION_SECRET set, using fallback secret. This is not secure for production!");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "chess-puzzle-dev-secret",
    resave: false,
    saveUninitialized: false,
    name: 'chess.sid',
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: '/',
      httpOnly: true
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie!.secure = true;
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes with better error handling
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
        isGuest: false,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        puzzlesSolved: 0,
        score: 0,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: { ...req.user, password: undefined } });
  });

  // Rate limiting for guest creation
  const guestCreationLimiter = new Map();

  app.post("/api/guest", async (req, res, next) => {
    try {
      const clientIp = req.ip;
      const now = Date.now();
      const lastCreation = guestCreationLimiter.get(clientIp) || 0;

      if (now - lastCreation < 60000) { // 1 minute cooldown
        return res.status(429).json({ error: "Please wait before creating another guest account" });
      }

      guestCreationLimiter.set(clientIp, now);
      const guestId = Math.random().toString(36).substring(7);
      const hashedPassword = await hashPassword(guestId);
      const user = await storage.createUser({
        username: `guest_${guestId}`,
        password: hashedPassword,
        isGuest: true,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        puzzlesSolved: 0,
        score: 0,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error) {
      console.error('Guest login error:', error);
      next(error);
    }
  });
}