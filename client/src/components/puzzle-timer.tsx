import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";

interface PuzzleTimerProps {
  startTime: Date;
  isComplete: boolean;
  onTimeUp?: () => void;
  duration?: number; // in seconds, defaults to 60
}

export default React.memo(function PuzzleTimer({ 
  startTime, 
  isComplete, 
  onTimeUp,
  duration = 60 
}: PuzzleTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        onTimeUp?.();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, isComplete, duration, onTimeUp]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Time Left</span>
          </div>
          <span className="text-2xl font-mono">
            {timeLeft}s
          </span>
        </div>
      </CardContent>
    </Card>
  );
});