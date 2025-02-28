import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import ChessBoard from "@/components/chess-board";
import GameChat from "@/components/game-chat";
import PuzzleTimer from "@/components/puzzle-timer";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";


export default function GameRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [moveIndex, setMoveIndex] = useState(0);
  const { sendMessage, subscribeToMessages } = useWebSocket(Number(id), user?.id);

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
    refetchInterval: 1000,
  });

  const cancelGameMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/games/${id}/cancel`);
    },
    onSuccess: () => {
      setLocation("/");
    },
  });

  const winMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/games/${id}/winner`, { winnerId: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${id}`] });
    },
  });

  useEffect(() => {
    subscribeToMessages((message) => {
      if (message.type === 'game_move') {
        setMoveIndex(message.payload.moveIndex);
      }
    });
  }, [subscribeToMessages]);

  const onMove = (move: string) => {
    sendMessage({
      type: 'game_move',
      payload: { move, moveIndex }
    });

    if (game && !game.winner && move === game.solution) {
      winMutation.mutate();
    }
  };

  const calculateDifficultyLabel = (rating: number): string => {
    if (rating < 1000) return "Easy";
    if (rating < 1500) return "Medium";
    if (rating < 2000) return "Hard";
    return "Expert";
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const opponent = game.player1Id === user!.id ? game.player2Id : game.player1Id;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          {game && game.player1Id === user?.id && game.status !== 'completed' && (
            <Button 
              variant="destructive"
              onClick={() => cancelGameMutation.mutate()}
              disabled={cancelGameMutation.isPending}
            >
              {cancelGameMutation.isPending ? "Canceling..." : "Cancel Game"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Puzzle Challenge</h2>
                <p className="text-sm text-muted-foreground">
                  Difficulty: {calculateDifficultyLabel(game.puzzleRating)} ({game.puzzleRating})
                </p>
              </CardHeader>
              <CardContent>
                <ChessBoard 
                  fen={game.currentPuzzle}
                  onMove={onMove}
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Game Info</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PuzzleTimer 
                    startTime={new Date(game.startedAt)}
                    isComplete={!!game.winner}
                  />
                  <div className="flex items-center justify-between">
                    <span>Your Rating</span>
                    <span className="font-mono">{user?.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Puzzles Solved</span>
                    <span className="font-mono">{user?.puzzlesSolved}</span>
                  </div>
                  {game.winner === user!.id && (
                    <div className="text-green-500 font-bold">You solved it!</div>
                  )}
                  {game.winner === opponent && (
                    <div className="text-red-500 font-bold">Opponent solved it first!</div>
                  )}
                </div>
              </CardContent>
            </Card>
            <GameChat gameId={Number(id)} />
          </div>
        </div>
      </div>
    </div>
  );
}
