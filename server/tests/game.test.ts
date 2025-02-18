import { expect, test, beforeAll, afterAll, describe, afterEach } from 'vitest';
import WebSocket from 'ws';
import { storage } from '../storage';
import { db } from '../db';
import { games, users } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import express from 'express';
import { registerRoutes } from '../routes';
import type { Server } from 'http';
import { Chess } from 'chess.js';

const TEST_PORT = 5001;
const WS_URL = `ws://localhost:${TEST_PORT}/ws`;
const TEST_TIMEOUT = 15000; // Increased timeout for WebSocket operations

describe('Game Tests', () => {
  let player1: any;
  let player2: any;
  let wsPlayer1: WebSocket;
  let wsPlayer2: WebSocket;
  let server: Server;

  beforeAll(async () => {
    console.log('Setting up test environment...');
    const app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server start timeout')), 5000);
      server.listen(TEST_PORT, '0.0.0.0', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    console.log(`Test server listening on port ${TEST_PORT}`);

    try {
      player1 = await storage.createUser({
        username: `test_player1_${Date.now()}`,
        password: 'test123',
        isGuest: false,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        puzzlesSolved: 0,
        score: 0
      });

      player2 = await storage.createUser({
        username: `test_player2_${Date.now()}`,
        password: 'test123',
        isGuest: false,
        rating: 1200,
        gamesPlayed: 0,
        gamesWon: 0,
        puzzlesSolved: 0,
        score: 0
      });

      console.log('Test users created:', { player1: player1.id, player2: player2.id });
    } catch (error) {
      console.error('Failed to create test users:', error);
      throw error;
    }
  });

  afterEach(async () => {
    // Close WebSocket connections between tests
    console.log('Cleaning up WebSocket connections...');
    if (wsPlayer1) {
      wsPlayer1.close();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (wsPlayer2) {
      wsPlayer2.close();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  afterAll(async () => {
    console.log('Starting test environment cleanup...');
    try {
      // Clean up database records first
      console.log('Cleaning up database records...');
      if (player1?.id) {
        await db.delete(games).where(or(
          eq(games.player1Id, player1.id),
          eq(games.player2Id, player1.id)
        ));
        await db.delete(users).where(eq(users.id, player1.id));
      }

      if (player2?.id) {
        await db.delete(users).where(eq(users.id, player2.id));
      }
      console.log('Database records cleaned up');

      // Close server last
      if (server) {
        console.log('Closing test server...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('Server close timed out, forcing close');
            resolve();
          }, 5000);

          server.close((err) => {
            clearTimeout(timeout);
            if (err) {
              console.error('Error closing server:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      console.log('Test server closed');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });

  const setupWebSocketConnection = async (playerId: number, label: string): Promise<WebSocket> => {
    console.log(`Setting up WebSocket connection for ${label} (ID: ${playerId})...`);
    const ws = new WebSocket(WS_URL);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), TEST_TIMEOUT);
      ws.on('open', () => {
        clearTimeout(timeout);
        console.log(`WebSocket connection established for ${label}`);
        resolve();
      });
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`WebSocket connection error for ${label}:`, error);
        reject(error);
      });
    });
    await authenticateWebSocket(ws, playerId, label);
    return ws;
  };

  const waitForMessage = async (ws: WebSocket, predicate: (message: any) => boolean, label: string): Promise<any> => {
    console.log(`Waiting for message on ${label}'s connection...`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error(`Message wait timeout for ${label}`);
        reject(new Error(`Message wait timeout for ${label}`));
      }, TEST_TIMEOUT);

      const messageHandler = (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`Received message on ${label}'s connection:`, message);
          if (predicate(message)) {
            clearTimeout(timeout);
            ws.removeListener('message', messageHandler);
            console.log(`Expected message received for ${label}`);
            resolve(message);
          }
        } catch (error) {
          console.error(`Error parsing message for ${label}:`, error);
        }
      };

      ws.on('message', messageHandler);
    });
  };

  test('should create a new game and handle moves', async () => {
    console.log('Starting game creation test...');
    const chess = new Chess();
    const initialPosition = chess.fen();

    const game = await storage.createGame({
      player1Id: player1.id,
      player2Id: player2.id,
      currentPosition: initialPosition,
      solution: 'e4',
      puzzleRating: 1200,
      status: 'active',
      movesPlayed: []
    });

    expect(game).toBeDefined();
    expect(game.id).toBeDefined();
    expect(game.status).toBe('active');
    console.log('Game created:', game.id);

    // Setup WebSocket connections
    wsPlayer1 = await setupWebSocketConnection(player1.id, 'Player 1');
    wsPlayer2 = await setupWebSocketConnection(player2.id, 'Player 2');

    // Make the e4 move
    chess.move('e4');
    const expectedFen = chess.fen();

    const moveData = {
      type: 'chess_move',
      payload: {
        gameId: game.id,
        move: 'e4',
        fen: expectedFen,
        playerId: player1.id
      }
    };

    console.log('Sending move from Player 1:', moveData);
    wsPlayer1.send(JSON.stringify(moveData));

    // Wait for both players to receive the move
    await Promise.all([
      waitForMessage(
        wsPlayer1,
        msg => msg.type === 'chess_move' && msg.payload.move === 'e4',
        'Player 1'
      ),
      waitForMessage(
        wsPlayer2,
        msg => msg.type === 'chess_move' && msg.payload.move === 'e4',
        'Player 2'
      )
    ]);

    // Verify game state
    const updatedGame = await storage.getGame(game.id);
    console.log('Verifying game state:', {
      expected: expectedFen,
      actual: updatedGame?.currentPosition
    });
    expect(updatedGame?.currentPosition).toBe(expectedFen);
  });

  test('should handle invalid moves correctly', async () => {
    console.log('Starting invalid move test...');
    const game = await storage.createGame({
      player1Id: player1.id,
      player2Id: player2.id,
      currentPosition: new Chess().fen(),
      solution: 'e4 e5',
      puzzleRating: 1200,
      status: 'active',
      movesPlayed: []
    });

    wsPlayer1 = await setupWebSocketConnection(player1.id, 'Player 1');
    wsPlayer2 = await setupWebSocketConnection(player2.id, 'Player 2');

    const invalidMoveData = {
      type: 'chess_move',
      payload: {
        gameId: game.id,
        move: 'a3a4',
        fen: game.currentPosition,
        playerId: player1.id
      }
    };

    console.log('Sending invalid move from Player 1:', invalidMoveData);
    wsPlayer1.send(JSON.stringify(invalidMoveData));

    const errorMessage = await waitForMessage(
      wsPlayer1,
      msg => msg.type === 'error' && msg.message === 'Invalid move: a3a4',
      'Player 1'
    );

    expect(errorMessage).toBeDefined();
    expect(errorMessage.type).toBe('error');

    const updatedGame = await storage.getGame(game.id);
    expect(updatedGame?.currentPosition).toBe(game.currentPosition);
  });

  test('should handle game state synchronization', async () => {
    console.log('Starting game state sync test...');
    const game = await storage.createGame({
      player1Id: player1.id,
      player2Id: player2.id,
      currentPosition: new Chess().fen(),
      solution: 'e4 e5 Nf3',
      puzzleRating: 1200,
      status: 'active',
      movesPlayed: []
    });

    wsPlayer1 = await setupWebSocketConnection(player1.id, 'Player 1');
    wsPlayer2 = await setupWebSocketConnection(player2.id, 'Player 2');

    const chess = new Chess();
    const moves = ['e4', 'e5', 'Nf3'];

    // Execute moves sequentially with proper validation
    for (const [index, move] of moves.entries()) {
      console.log(`Making move ${index + 1}/${moves.length}: ${move}`);
      const moveResult = chess.move(move);
      if (!moveResult) {
        throw new Error(`Invalid move: ${move}`);
      }

      const moveData = {
        type: 'chess_move',
        payload: {
          gameId: game.id,
          move: move,
          fen: chess.fen(),
          playerId: index % 2 === 0 ? player1.id : player2.id
        }
      };

      // Send move from the appropriate player
      const currentPlayer = index % 2 === 0 ? wsPlayer1 : wsPlayer2;
      const playerLabel = index % 2 === 0 ? 'Player 1' : 'Player 2';
      console.log(`Sending move from ${playerLabel}:`, moveData);
      currentPlayer.send(JSON.stringify(moveData));

      // Wait for both players to receive the move
      await Promise.all([
        waitForMessage(
          wsPlayer1,
          msg => msg.type === 'chess_move' && msg.payload.move === move,
          'Player 1'
        ),
        waitForMessage(
          wsPlayer2,
          msg => msg.type === 'chess_move' && msg.payload.move === move,
          'Player 2'
        )
      ]);

      console.log(`Move ${move} synchronized`);

      // Verify game state
      const updatedGame = await storage.getGame(game.id);
      console.log('Verifying game state after move:', {
        move,
        expected: chess.fen(),
        actual: updatedGame?.currentPosition
      });
      expect(updatedGame?.currentPosition).toBe(chess.fen());
      expect(updatedGame?.movesPlayed).toContain(move);
    }
  });
});

async function authenticateWebSocket(ws: WebSocket, userId: number, label: string): Promise<void> {
  console.log(`Authenticating WebSocket for ${label} (ID: ${userId})...`);
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`WebSocket authentication timeout for ${label}`));
    }, TEST_TIMEOUT);

    const authHandler = (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`Auth response for ${label}:`, message);
        if (message.type === 'auth' && message.status === 'success') {
          clearTimeout(timeout);
          ws.removeListener('message', authHandler);
          console.log(`WebSocket authenticated for ${label}`);
          resolve();
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.removeListener('message', authHandler);
        console.error(`Authentication error for ${label}:`, error);
        reject(error);
      }
    };

    ws.on('message', authHandler);
    ws.on('error', (error) => {
      clearTimeout(timeout);
      ws.removeListener('message', authHandler);
      console.error(`WebSocket error during auth for ${label}:`, error);
      reject(error);
    });

    console.log(`Sending auth request for ${label}...`);
    ws.send(JSON.stringify({
      type: 'auth',
      userId
    }));
  });
}