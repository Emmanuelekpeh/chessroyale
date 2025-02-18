import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ChessBoard from "@/components/chess-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Star, Trophy } from "lucide-react";
import type { Puzzle } from "@shared/schema";

export default function PuzzleSolver() {
  const { id } = useParams();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const { data: puzzle, isLoading, error } = useQuery<Puzzle>({
    queryKey: ["/api/puzzles", id],
    retry: 2,
    staleTime: 30000,
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load puzzle: {error.message}</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!puzzle) {
    return <div>No puzzle data</div>; // Handle case where puzzle is null
  }


  const solution = puzzle.solution.split(/\s+/);
  const isComplete = currentMoveIndex >= solution.length;

  const handleMove = (move: string) => {
    if (move === solution[currentMoveIndex]) {
      setCurrentMoveIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-[1fr_300px]">
        {/* Main chess board area */}
        <Card className="p-6">
          <ChessBoard
            fen={puzzle.fen}
            onMove={handleMove}
            solution={solution}
            currentMoveIndex={currentMoveIndex}
            showHint={showHint}
          />
        </Card>

        {/* Puzzle information sidebar */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {puzzle.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {puzzle.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {puzzle.tacticalTheme?.map(theme => (
                  <Badge key={theme} variant="secondary">
                    {theme}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Rating: {puzzle.rating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Difficulty: {puzzle.difficulty}</span>
                </div>
              </div>

              {isComplete && (
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Puzzle completed! Well done!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}