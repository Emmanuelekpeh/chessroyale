import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Game, User } from "@shared/schema";
import GameList from "@/components/game-list";
import Leaderboard from "@/components/leaderboard";
import { Button } from "@/components/ui/button";
import { Crown, LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: leaderboard } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6" />
            <h1 className="text-xl font-bold">Chess Puzzle Battle</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GameList games={games || []} currentUser={user!} />
          </div>
          <div>
            <Leaderboard users={leaderboard || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
