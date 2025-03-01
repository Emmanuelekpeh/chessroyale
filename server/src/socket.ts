import { Server, Socket } from 'socket.io';
import { getUserById, createGame, updateGame, getGameById } from './storage';

interface GameRoom {
  gameId: string;
  players: {
    white?: number;
    black?: number;
  };
  spectators: number[];
}

const gameRooms = new Map<string, GameRoom>();
const userSocketMap = new Map<number, string>();
const socketUserMap = new Map<string, number>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected', socket.id);
    
    // Authenticate socket
    const session = (socket.request as any).session;
    const userId = session?.passport?.user;
    
    if (userId) {
      // Associate the socket with the user
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);
      
      // Update user's last active time
      getUserById(userId).then(user => {
        if (user) {
          socket.broadcast.emit('user:online', { userId });
        }
      });
    }
    
    // Join a game
    socket.on('game:join', async ({ gameId, side }) => {
      try {
        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }
        
        const game = await getGameById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        let room = gameRooms.get(gameId);
        if (!room) {
          room = {
            gameId,
            players: {},
            spectators: []
          };
          gameRooms.set(gameId, room);
        }
        
        socket.join(gameId);
        
        if (side === 'white' && game.white_player === userId) {
          room.players.white = userId;
        } else if (side === 'black' && game.black_player === userId) {
          room.players.black = userId;
        } else {
          // Join as spectator
          room.spectators.push(userId);
        }
        
        // Notify others in the room
        io.to(gameId).emit('game:playerJoined', { 
          gameId, 
          userId,
          side: room.players.white === userId ? 'white' : 
                room.players.black === userId ? 'black' : 'spectator'
        });
        
        // Send current game state
        socket.emit('game:state', game);
      } catch (err) {
        console.error('Error joining game:', err);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });
    
    // Make a move in a game
    socket.on('game:move', async ({ gameId, move, fen }) => {
      try {
        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }
        
        const game = await getGameById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        const isWhite = game.white_player === userId;
        const isBlack = game.black_player === userId;
        
        if (!isWhite && !isBlack) {
          socket.emit('error', { message: 'You are not a player in this game' });
          return;
        }
        
        // Update game state
        const updatedGame = await updateGame(gameId, { 
          fen,
          moves: [...game.moves, move]
        });
        
        // Broadcast move to all clients in the room
        io.to(gameId).emit('game:moved', { 
          gameId, 
          move,
          fen,
          userId
        });
      } catch (err) {
        console.error('Error making move:', err);
        socket.emit('error', { message: 'Failed to make move' });
      }
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      const disconnectedUserId = socketUserMap.get(socket.id);
      if (disconnectedUserId) {
        userSocketMap.delete(disconnectedUserId);
        socketUserMap.delete(socket.id);
        
        // Notify others that user is offline
        socket.broadcast.emit('user:offline', { userId: disconnectedUserId });
      }
      
      console.log('Client disconnected', socket.id);
    });
  });
}

// Helper to send message to a specific user
export function sendToUser(userId: number, event: string, data: any) {
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    const io = global.io as Server;
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}
