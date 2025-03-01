import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { getUserByUsername, getUserById, createUser } from "./storage";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const BCRYPT_SALT_ROUNDS = 10;

// Define non-recursive User type
interface User {
  id: number;
  username: string;
  passwordHash: string;
  email?: string;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  puzzleRating: number;
  createdAt: Date;
  updatedAt: Date;
  isGuest: boolean;
}

// Setting up passport auth
passport.use(
  new LocalStrategy(async (username: string, password: string, done: passport.DoneCallback) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: User, done: (err: any, id?: number) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: (err: any, user?: User) => void) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export function configureAuth(app: express.Application) {
  app.use(passport.initialize() as express.RequestHandler);
  app.use(passport.session() as express.RequestHandler);

  // Login endpoint
  app.post("/api/auth/login", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }

      req.logIn(user, (err: Error) => {
        if (err) {
          return next(err);
        }

        // Create a JWT token
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            expiresIn: "24h",
          },
          JWT_SECRET
        );

        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            rating: user.rating,
            puzzleRating: user.puzzleRating,
          },
          token,
        });
      });
    })(req, res, next);
  });

  // Register endpoint
  app.post(
    "/api/auth/register",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { username, password, email } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          message: "Username and password are required",
        });
      }

      try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({
            message: "Username already exists",
          });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const newUser = await createUser(username, passwordHash, email);

        // Create a JWT token
        const token = jwt.sign(
          {
            id: newUser.id,
            username: newUser.username,
            expiresIn: "24h",
          },
          JWT_SECRET
        );

        return res.status(201).json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            rating: newUser.rating,
            puzzleRating: newUser.puzzleRating,
          },
          token,
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  // Logout endpoint
  app.post("/api/auth/logout", (req: express.Request, res: express.Response) => {
    req.logout(() => {
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // JWT Middleware for protected routes
  app.use("/api/protected", authenticateJWT);

  return app;
}

// Middleware to check if user is authenticated
export function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to validate JWT tokens
export function authenticateJWT(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Create guest user
export async function createGuestUser(): Promise<User> {
  const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
  const passwordHash = await bcrypt.hash(
    Math.random().toString(36),
    BCRYPT_SALT_ROUNDS
  );
  const user = await createUser(guestId, passwordHash);
  
  // Update user to mark as guest
  return {
    ...user,
    isGuest: true
  } as User;
}
