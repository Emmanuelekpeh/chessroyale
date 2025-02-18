import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, MoveVertical, Gauge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface PuzzleControlsProps {
  onDifficultyChange: (difficulty: string) => void;
  onTimeExpired: () => void;
  moveCount: number;
  totalMoves: number;
  isTimerEnabled?: boolean;
  isPaused?: boolean;
}

type TimerMode = 'relaxed' | 'normal' | 'blitz';

const timerSettings = {
  relaxed: 90,
  normal: 40,
  blitz: 20
};

export default function PuzzleControls({ 
  onDifficultyChange,
  onTimeExpired,
  moveCount,
  totalMoves,
  isTimerEnabled = true,
  isPaused = false
}: PuzzleControlsProps) {
  const [timeLeft, setTimeLeft] = useState(timerSettings.normal);
  const [timerMode, setTimerMode] = useState<TimerMode>('normal');
  const [isTimerRunning, setIsTimerRunning] = useState(!isPaused && isTimerEnabled);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          onTimeExpired();
          return timerSettings[timerMode];
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeExpired, timerMode, isTimerRunning]);

  useEffect(() => {
    setIsTimerRunning(!isPaused && isTimerEnabled);
  }, [isPaused, isTimerEnabled]);

  const handleTimerModeChange = (mode: TimerMode) => {
    setTimerMode(mode);
    setTimeLeft(timerSettings[mode]);
    setIsTimerRunning(!isPaused && isTimerEnabled);
  };

  const generatePuzzlesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/puzzles/generate?count=5');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Generating Puzzles',
        description: 'New puzzles are being generated. They will appear shortly.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/puzzles'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate puzzles. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const progressPercentage = (moveCount / Math.max(1, totalMoves)) * 100;

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {isTimerEnabled && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Left
              </Label>
              <div className={`text-2xl font-mono ${timeLeft < 10 ? 'text-red-500' : ''}`}>
                {timeLeft}s
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MoveVertical className="h-4 w-4" />
              Progress
            </Label>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Move {moveCount} of {totalMoves}
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {isTimerEnabled && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Timer Mode
              </Label>
              <Select value={timerMode} onValueChange={handleTimerModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed (90s)</SelectItem>
                  <SelectItem value="normal">Normal (40s)</SelectItem>
                  <SelectItem value="blitz">Blitz (20s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select defaultValue="all" onValueChange={onDifficultyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Generate</Label>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => generatePuzzlesMutation.mutate()}
              disabled={generatePuzzlesMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generatePuzzlesMutation.isPending ? 'Generating...' : 'Generate Puzzles'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}