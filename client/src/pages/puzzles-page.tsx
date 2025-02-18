import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChessBoard from '@/components/chess-board';
import { PuzzleAnimation } from '@/components/puzzle-animation';
import PuzzleControls from '@/components/puzzle-controls';
import { ArrowLeft, Brain } from 'lucide-react';
import type { Puzzle } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function PuzzlesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [solution, setSolution] = useState<string[]>([]);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [moveCount, setMoveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all"); // Added state for selected difficulty
  const puzzleRef = useRef<Puzzle | null>(null);
  const isMountedRef = useRef(true);

  const PAGE_SIZE = 10;

  const { data: puzzles = [], isLoading, error } = useQuery<Puzzle[]>({
    queryKey: ['puzzles', { page, pageSize: PAGE_SIZE, difficulty: selectedDifficulty }], // Added difficulty to queryKey
    queryFn: async () => {
      const response = await fetch(`/api/puzzles?verified=true&page=${page}&pageSize=${PAGE_SIZE}&difficulty=${selectedDifficulty}`); // Added difficulty to fetch URL
      if (!response.ok) {
        throw new Error('Failed to fetch puzzles');
      }
      return response.json();
    },
    retry: 2,
    staleTime: 30000,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold">Failed to load puzzles</h2>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  // Load puzzle effect with cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized puzzle selection logic - updated to use selectedDifficulty
  const selectRandomPuzzle = useCallback((availablePuzzles: Puzzle[]) => {
    if (!availablePuzzles.length) return null;
    const filteredPuzzles = selectedDifficulty === "all"
      ? availablePuzzles
      : availablePuzzles.filter(p => p.difficulty === selectedDifficulty);

    if (filteredPuzzles.length === 0) return null;
    return filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
  }, [selectedDifficulty]);

  // Update puzzle effect with proper cleanup and race condition prevention
  useEffect(() => {
    if (!isLoading && puzzles.length > 0 && !currentPuzzle) {
      const newPuzzle = selectRandomPuzzle(puzzles);
      if (newPuzzle && isMountedRef.current) {
        setCurrentPuzzle(newPuzzle);
        puzzleRef.current = newPuzzle;
        if (newPuzzle.solution) {
          setSolution(newPuzzle.solution.split(' '));
          setMoveIndex(0);
          setIsPlayingAnimation(false);
          setMoveCount(0);
        }
      }
    }
  }, [isLoading, puzzles, currentPuzzle, selectRandomPuzzle]);

  const loadNextPuzzle = useCallback(() => {
    const newPuzzle = selectRandomPuzzle(puzzles);
    if (newPuzzle && isMountedRef.current) {
      setCurrentPuzzle(newPuzzle);
      puzzleRef.current = newPuzzle;
      setSolution(newPuzzle.solution.split(' '));
      setMoveIndex(0);
      setIsPlayingAnimation(false);
      setMoveCount(0);
    }
  }, [puzzles, selectRandomPuzzle]);

  const handleMove = useCallback((move: string) => {
    if (!currentPuzzle || !solution[moveIndex] || isPlayingAnimation) return;

    setMoveCount(prev => prev + 1);

    if (move.toLowerCase() === solution[moveIndex].toLowerCase()) {
      if (moveIndex === solution.length - 1) {
        toast({
          title: "Puzzle Completed!",
          description: "Great job! Loading next puzzle...",
        });
        loadNextPuzzle();
      } else {
        setMoveIndex(prevIndex => prevIndex + 1);
      }
    } else {
      toast({
        title: "Incorrect Move",
        description: "Try again or watch the solution animation for help.",
        variant: "destructive",
      });
    }
  }, [currentPuzzle, solution, moveIndex, isPlayingAnimation, toast, loadNextPuzzle]);

  const handleAnimationStep = useCallback((step: number) => {
    setMoveIndex(step);
  }, []);

  const handleTimeExpired = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Moving to the next puzzle...",
    });
    loadNextPuzzle();
  }, [toast, loadNextPuzzle]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Puzzle Training
          </h1>
        </div>

        <div className="flex justify-between items-center mb-6"> {/* Added div for difficulty selector */}
          <PuzzleControls
            onDifficultyChange={setDifficulty}
            onTimeExpired={handleTimeExpired}
            moveCount={moveCount}
            totalMoves={solution.length}
          />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 rounded-lg bg-secondary"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Puzzle</span>
                {currentPuzzle && (
                  <span className="text-sm font-normal text-muted-foreground">
                    Rating: {currentPuzzle.rating}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading puzzles...</div>
              ) : currentPuzzle ? (
                <>
                  <ChessBoard
                    fen={currentPuzzle.fen}
                    onMove={handleMove}
                    solution={solution}
                    currentMoveIndex={moveIndex}
                    isPlayingAnimation={isPlayingAnimation}
                    customOptions={{
                      boardTheme: 'green',
                      showCoordinates: true
                    }}
                  />
                  <div className="mt-8">
                    <PuzzleAnimation
                      solution={solution}
                      onAnimationStep={handleAnimationStep}
                      onPlayingChange={setIsPlayingAnimation}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">No puzzles available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}