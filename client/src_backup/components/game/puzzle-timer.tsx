import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";

interface PuzzleTimerProps {
  startTime: Date;
  isComplete: boolean;
}

export default function PuzzleTimer({ startTime, isComplete }: PuzzleTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isComplete) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-mono">{formatTime(elapsed)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
