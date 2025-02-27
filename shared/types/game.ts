export interface GameState {
  id: string;
  fen: string;
  players: {
    white: string;
    black: string;
  };
  timeControl: {
    initial: number;
    increment: number;
  };
  moves: string[];
  status: 'waiting' | 'active' | 'completed';
  winner?: 'white' | 'black' | 'draw';
  chat: ChatMessage[];
}

export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: number;
}
