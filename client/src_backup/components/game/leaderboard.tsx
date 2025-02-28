import { User } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface LeaderboardProps {
  users: User[];
}

export default function Leaderboard({ users }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-semibold w-6">{index + 1}</span>
                <span>{user.username}</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{user.score} pts</div>
                <div className="text-sm text-muted-foreground">
                  {user.gamesWon}/{user.gamesPlayed} won
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
