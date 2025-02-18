import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChessBoard from '@/components/chess-board';
import HintPanel from '@/components/hint-panel';
import { ArrowLeft, Swords, Loader2 } from 'lucide-react';
import type { Game, Puzzle } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PuzzleControls from '@/components/puzzle-controls';

export default function BattlePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const gameId = parseInt(id || '0');
  const { sendMessage } = useWebSocket();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [moveIndex, setMoveIndex] = useState(0);
  const [currentSolution, setCurrentSolution] = useState<string[]>([]);

  const { data: game, isLoading: gameLoading } = useQuery<Game>({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
    refetchInterval: game?.status === 'in_progress' ? 1000 : false,
  });

  const { data: puzzle, isLoading: puzzleLoading } = useQuery<Puzzle>({
    queryKey: ['/api/puzzles', game?.puzzleId],
    enabled: !!game?.puzzleId,
  });

  const isPlayer1 = useMemo(() => user?.id === game?.player1Id, [user?.id, game?.player1Id]);
  const isSpectator = useMemo(() => !isPlayer1 && game?.player2Id !== user?.id, [isPlayer1, game?.player2Id, user?.id]);

  useEffect(() => {
    if (puzzle?.solution) {
      setCurrentSolution(puzzle.solution.split(' '));
      setMoveIndex(0);
      setHintsUsed(0);
    }
  }, [puzzle]);

  const attemptMutation = useMutation({
    mutationFn: async ({ move, completed }: { move: string; completed: boolean }) => {
      const res = await apiRequest('POST', `/api/puzzles/${game?.puzzleId}/attempt`, {
        move,
        completed,
        hintsUsed,
        timeSpent: 60 - timeLeft,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.completed) {
        sendMessage({
          type: 'puzzle_solved',
          payload: { playerId: user?.id },
        });
        setHintsUsed(0);
        setMoveIndex(0);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
    },
  });

  const handleGameOver = useCallback(() => {
    if (game?.status === 'complete') {
      toast({
        title: 'Game Over!',
        description: `${game.player1Score > game.player2Score ? 'Player 1' : 'Player 2'} wins!`,
      });
      setTimeout(() => setLocation('/'), 3000);
    }
  }, [game?.status, game?.player1Score, game?.player2Score, setLocation, toast]);

  useEffect(() => {
    if (!game || game.status !== 'in_progress') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          sendMessage({
            type: 'game_over',
            payload: {
              winner: game.player1Score > game.player2Score ? 'Player 1' : 'Player 2'
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game, sendMessage]);

  useEffect(() => {
    handleGameOver();
  }, [handleGameOver]);

  const handleMove = useCallback((move: string) => {
    if (!currentSolution[moveIndex]) return;

    const isCorrect = move.toLowerCase() === currentSolution[moveIndex].toLowerCase();

    if (isCorrect) {
      if (moveIndex === currentSolution.length - 1) {
        attemptMutation.mutate({ move, completed: true });
      } else {
        setMoveIndex(prev => prev + 1);
        toast({
          title: 'Correct Move!',
          description: 'Keep going...',
        });
      }
    } else {
      attemptMutation.mutate({ move, completed: false });
      toast({
        title: 'Incorrect Move',
        description: 'Try again!',
        variant: 'destructive',
      });
    }
  }, [moveIndex, currentSolution, attemptMutation, toast]);

  if (gameLoading || puzzleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!game || !puzzle) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="h-6 w-6" />
            Puzzle Battle
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <PuzzleControls
              onTimeExpired={() => {
                if (game.status === 'in_progress') {
                  sendMessage({
                    type: 'game_over',
                    payload: {
                      winner: game.player1Score > game.player2Score ? 'Player 1' : 'Player 2'
                    }
                  });
                }
              }}
              onDifficultyChange={() => {}} 
              moveCount={moveIndex}
              totalMoves={currentSolution.length}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Puzzle</span>
                  <span className="text-lg font-mono">{timeLeft}s</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChessBoard 
                  fen={puzzle.fen}
                  onMove={handleMove}
                  disabled={isSpectator || game.status !== 'in_progress'}
                  customOptions={{
                    boardTheme: 'green',
                    showCoordinates: true,
                  }}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{game.player1Score}</p>
                    <p className="text-sm text-muted-foreground">
                      Player 1 {isPlayer1 ? '(You)' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{game.player2Score}</p>
                    <p className="text-sm text-muted-foreground">
                      Player 2 {!isPlayer1 && !isSpectator ? '(You)' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <HintPanel
              solution={currentSolution[moveIndex] || ''}
              hintsAvailable={Math.max(0, puzzle.hintsAvailable - hintsUsed)}
              onUseHint={() => setHintsUsed(prev => prev + 1)}
              disabled={isSpectator || game.status !== 'in_progress'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}