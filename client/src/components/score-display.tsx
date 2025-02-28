import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { GameState } from "@shared/schema";

interface ScoreDisplayProps {
  playerScore: number;
  opponentScore: number;
  gameStatus: GameState["status"];
}

export default function ScoreDisplay({
  playerScore,
  opponentScore,
  gameStatus,
}: ScoreDisplayProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{playerScore}</div>
            <div className="text-sm text-muted-foreground">Your Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{opponentScore}</div>
            <div className="text-sm text-muted-foreground">Opponent's Score</div>
          </div>
        </div>

        {gameStatus === "complete" && (
          <div className="flex items-center justify-center gap-2 text-lg font-bold">
            {playerScore > opponentScore ? (
              <>
                <Trophy className="h-5 w-5 text-yellow-500" />
                You Won!
              </>
            ) : playerScore < opponentScore ? (
              "You Lost"
            ) : (
              "Draw"
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
