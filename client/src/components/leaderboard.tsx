import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { User } from "@shared/schema";

interface LeaderboardProps {
  users: User[];
}

export default function Leaderboard({ users }: LeaderboardProps) {
  const sortedUsers = [...users].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Top Players
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-base w-6">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {user.username}
                    {user.isGuest && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Guest)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {user.puzzlesSolved} puzzles
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{user.score}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {user.gamesWon}/{user.gamesPlayed} wins
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}