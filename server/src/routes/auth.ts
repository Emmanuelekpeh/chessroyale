import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { createUser, getUserByUsername } from '../storage';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if username already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await createUser(username, passwordHash, email);
    
    // Auto login after registration
    req.login(newUser, (err) => {
      if (err) return next(err);
      res.status(201).json({ user: { id: newUser.id, username: newUser.username } });
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message || 'Authentication failed' });
    
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ user: { id: user.id, username: user.username } });
    });
  })(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/current', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as any;
  res.json({ user: { id: user.id, username: user.username } });
});

export default router;
