import { expect, test, beforeAll, afterAll, describe } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import express from 'express';
import { registerRoutes } from '../routes';
import supertest from 'supertest';

describe('Authentication Tests', () => {
  let app: express.Express;
  let request: supertest.SuperTest<supertest.Test>;
  let testUser: any;

  beforeAll(async () => {
    console.log('Setting up authentication test environment...');
    
    app = express();
    await registerRoutes(app);
    request = supertest(app);

    // Create test user
    testUser = await storage.createUser({
      username: `test_auth_${Date.now()}`,
      password: 'test123',
      isGuest: false,
      rating: 1200,
      gamesPlayed: 0,
      gamesWon: 0,
      puzzlesSolved: 0,
      score: 0
    });
    
    console.log('Test user created:', testUser.id);
  });

  afterAll(async () => {
    console.log('Cleaning up authentication test environment...');
    
    try {
      if (testUser?.id) {
        await db.delete(users).where(eq(users.id, testUser.id));
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });

  test('should register a new user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        username: `new_user_${Date.now()}`,
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.username).toMatch(/^new_user_/);
  });

  test('should prevent duplicate username registration', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('should login existing user', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'test123'
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe(testUser.id);
  });

  test('should reject invalid login credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
  });

  test('should protect routes requiring authentication', async () => {
    // Try accessing protected route without authentication
    const response = await request.get('/api/puzzles/recommended');
    expect(response.status).toBe(401);

    // Login and try again with authentication
    const loginResponse = await request
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'test123'
      });

    const cookie = loginResponse.headers['set-cookie'];
    
    const protectedResponse = await request
      .get('/api/puzzles/recommended')
      .set('Cookie', cookie);
      
    expect(protectedResponse.status).toBe(200);
  });

  test('should handle user logout', async () => {
    // Login first
    const loginResponse = await request
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'test123'
      });

    const cookie = loginResponse.headers['set-cookie'];

    // Logout
    const logoutResponse = await request
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutResponse.status).toBe(200);

    // Verify protected routes are inaccessible after logout
    const protectedResponse = await request
      .get('/api/puzzles/recommended')
      .set('Cookie', cookie);
      
    expect(protectedResponse.status).toBe(401);
  });
});
