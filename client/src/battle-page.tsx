import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ChessBoard from "@/components/chess-board";
import ScoreDisplay from "@/components/score-display";
import Timer from "@/components/timer";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { GameState, ChessPuzzle } from "@shared/schema";

export default function BattlePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: game } = useQuery<GameState>({
    queryKey: ["/api/games", id],
    refetchInterval: 1000,
  });

  const { data: puzzle } = useQuery<ChessPuzzle>({
    queryKey: ["/api/puzzles", game?.puzzleId],
    enabled: !!game?.puzzleId,
  });

  const { mutate: makeMove } = useMutation({
    mutationFn: async (move: string) => {
      const res = await apiRequest("POST", `/api/games/${id}/moves`, { move });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", id] });
    },
  });

  useEffect(() => {
    if (game?.status === "complete") {
      setTimeout(() => setLocation("/"), 3000);
    }
  }, [game?.status, setLocation]);

  if (!game || !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isPlayer1 = user?.id === game.player1;
  const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
  const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
  const isPlayerTurn = (isPlayer1 && game.currentTurn === game.player1) ||
    (!isPlayer1 && game.currentTurn === game.player2);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-[1fr_300px]">
        <Card className="p-6">
          <ChessBoard
            fen={puzzle.fen}
            onMove={(move) => isPlayerTurn && makeMove(move)}
          />
        </Card>

        <div className="space-y-8">
          <Timer timeRemaining={game.timeRemaining} />
          <ScoreDisplay
            playerScore={playerScore}
            opponentScore={opponentScore}
            gameStatus={game.status}
          />
        </div>
      </div>
    </div>
  );
}
