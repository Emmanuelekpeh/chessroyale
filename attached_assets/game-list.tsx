import { Game, User } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Users, Brain } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface GameListProps {
  games: Game[];
  currentUser: User;
}

export default function GameList({ games, currentUser }: GameListProps) {
  const createGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games", {
        player1Id: currentUser.id,
        status: "waiting",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const createPracticeGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/games/practice", {
        player1Id: currentUser.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  const joinGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      await apiRequest("POST", `/api/games/${gameId}/join`, {
        playerId: currentUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-bold">Games</h2>
        </div>
        <div className="space-x-2">
          <Button onClick={() => createPracticeGameMutation.mutate()}>
            <Brain className="h-4 w-4 mr-2" />
            Practice
          </Button>
          <Button onClick={() => createGameMutation.mutate()}>
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {games.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No active games. Start a new one or try practice mode!
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => {
              const canJoin = game.status === "waiting" && game.player1Id !== currentUser.id;
              const isPractice = game.status === "practice";

              return (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-semibold">
                      {isPractice ? "Practice Game" : `Game #${game.id}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isPractice 
                        ? "Solo puzzle solving" 
                        : game.status === "waiting" 
                          ? "Waiting for opponent" 
                          : "In progress"}
                    </div>
                  </div>
                  {canJoin ? (
                    <Button 
                      size="sm" 
                      onClick={() => joinGameMutation.mutate(game.id)}
                      disabled={joinGameMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Join Game
                    </Button>
                  ) : (
                    <Link href={`/game/${game.id}`}>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        {isPractice 
                          ? "Continue Practice" 
                          : game.player1Id === currentUser.id 
                            ? "Resume Game" 
                            : "View Game"}
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}