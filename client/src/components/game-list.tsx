import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Swords, Brain, Trophy } from "lucide-react";
import type { Game, User } from "@shared/schema";

interface GameListProps {
  games: Game[];
  currentUser: User;
}

export default function GameList({ games, currentUser }: GameListProps) {
  const [, setLocation] = useLocation();

  const activeGames = games.filter(game => game.status === "waiting" || game.status === "in_progress");

  return (
    <div className="space-y-8">
      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Brain className="h-12 w-12 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Solve Puzzles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Train your tactical skills with curated puzzles
              </p>
              <Button 
                className="w-full" 
                onClick={() => setLocation("/puzzles")}
              >
                Start Training
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-lg">Create Game</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Host a puzzle battle and challenge others
              </p>
              <Button 
                className="w-full" 
                onClick={() => setLocation("/game/create")}
              >
                Create Battle
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col items-center text-center space-y-4">
            <Swords className="h-12 w-12 text-blue-500" />
            <div>
              <h3 className="font-semibold text-lg">Create Content</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your knowledge by creating puzzles or tutorials
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/puzzle/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Puzzle
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/tutorial/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tutorial
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Games List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGames.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No active games. Create or join a battle to get started!
              </p>
            ) : (
              activeGames.map(game => (
                <Card key={game.id} className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {game.status === "waiting" ? "Waiting for opponent" : "Game in progress"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Started by: Player {game.player1Id}
                      </p>
                    </div>
                    <div className="w-full sm:w-auto">
                      {game.status === "waiting" && game.player1Id !== currentUser.id ? (
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => setLocation(`/battle/${game.id}`)}
                        >
                          <Swords className="h-4 w-4 mr-2" />
                          Join Battle
                        </Button>
                      ) : (
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => setLocation(`/game/${game.id}`)}
                        >
                          View Game
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}