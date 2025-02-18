
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserPuzzleHistory } from "@shared/schema";

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: puzzleHistory = [] } = useQuery<UserPuzzleHistory[]>({
    queryKey: [`/api/users/${user?.id}/puzzle-history`],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Your Puzzle History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {puzzleHistory.map((history) => (
                <div key={history.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-medium">Puzzle #{history.puzzleId}</div>
                    <div className="text-sm text-muted-foreground">
                      Attempts: {history.attempts} | Hints: {history.hintsUsed}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={history.completed ? "text-green-500" : "text-red-500"}>
                      {history.completed ? "Completed" : "Incomplete"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time: {Math.round(history.timeSpent / 1000)}s
                    </div>
                  </div>
                </div>
              ))}
              {puzzleHistory.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No puzzle history yet. Start solving puzzles to see your progress!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
