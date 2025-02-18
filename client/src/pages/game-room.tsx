import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChessBoard from '@/components/chess-board';
import { ArrowLeft } from 'lucide-react';
import type { Game } from '@shared/schema';
import { Chess } from 'chess.js';

export default function GameRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const gameId = parseInt(id || '0');
  const { isConnected, sendMessage } = useWebSocket();
  const [currentFen, setCurrentFen] = useState('');

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    refetchInterval: 1000, // Poll every second for updates
  });

  const updateGameMutation = useMutation({
    mutationFn: async (updates: Partial<Game>) => {
      const res = await apiRequest('PATCH', `/api/games/${gameId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
    },
  });

  useEffect(() => {
    if (game) {
      setCurrentFen(game.currentPosition || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }
  }, [game]);

  const handleMove = (san: string) => {
    if (!game || !user) return;

    const chessGame = new Chess(currentFen);
    try {
      const move = chessGame.move(san);
      if (move) {
        const newFen = chessGame.fen();
        setCurrentFen(newFen);

        // Send move via WebSocket
        sendMessage({
          type: 'chess_move',
          payload: {
            gameId,
            move: san,
            fen: newFen,
            playerId: user.id
          }
        });

        // Update game state in database
        updateGameMutation.mutate({
          currentPosition: newFen,
          lastMove: san,
          lastMoveBy: user.id
        });
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  if (!game) return null;

  const isPlayer = game.player1Id === user?.id || game.player2Id === user?.id;
  const isPlayerTurn = 
    (game.player1Id === user?.id && !game.lastMoveBy) || 
    (game.lastMoveBy && game.lastMoveBy !== user?.id);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Game Room</h1>
          {!isConnected && (
            <div className="text-destructive">
              Disconnected - Reconnecting...
            </div>
          )}
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Game</CardTitle>
            </CardHeader>
            <CardContent>
              <ChessBoard 
                fen={currentFen}
                onMove={handleMove}
                disabled={!isPlayer || !isPlayerTurn || game.status !== 'in_progress'}
                customOptions={{
                  showCoordinates: true,
                  boardOrientation: game.player2Id === user?.id ? 'black' : 'white',
                  boardTheme: 'green'
                }}
              />
              {isLoading && (
                <div className="mt-4 text-center text-muted-foreground">
                  Syncing moves...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}