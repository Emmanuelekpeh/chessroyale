import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import GameList from "@/components/game-list";
import Leaderboard from "@/components/leaderboard";
import { DailyChallenge } from "@/components/daily-challenge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Game, User } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1fr,300px]">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <DailyChallenge />
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.rating || 0}</div>
                <div className="text-sm text-muted-foreground">Current Rating</div>
              </CardContent>
            </Card>
          </div>
          <GameList games={games} currentUser={user!} />
        </div>
        <div className="space-y-8">
          <Leaderboard users={users} />
        </div>
      </div>
    </div>
  );
}