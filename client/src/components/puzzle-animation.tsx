import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PuzzleAnimationProps {
  solution: string[];
  onAnimationStep: (step: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

export const PuzzleAnimation = React.memo(({
  solution,
  onAnimationStep,
  onPlayingChange,
}: PuzzleAnimationProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1); // Animation speed in seconds
  const [isDarkMode, setIsDarkMode] = useState(false); // Theme toggle state
  const animationFrameRef = useRef<number>();
  const lastStepTimeRef = useRef<number>(0);
  const toast = useToast(); // Use the toast hook

  // Use requestAnimationFrame for smoother animations
  useEffect(() => {
    let animationFrame: number;
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;

      if (isPlaying && elapsed >= speed * 1000) {
        setCurrentStep((prev) => {
          if (prev >= solution.length - 1) {
            setIsPlaying(false);
            // Add a success toast notification upon completion
            toast({ title: 'Puzzle Solved!', description: 'Congratulations!', variant: 'success' });
            return prev;
          }
          return prev + 1;
        });
        lastTimestamp = timestamp;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, speed, solution.length, toast]);

  useEffect(() => {
    onAnimationStep(currentStep);
  }, [currentStep, onAnimationStep]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      onPlayingChange(newState);
      lastStepTimeRef.current = 0; // Reset timer on play/pause
      return newState;
    });
  }, [onPlayingChange]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onPlayingChange(false);
    lastStepTimeRef.current = 0;
  }, [onPlayingChange]);

  const nextStep = useCallback(() => {
    if (currentStep < solution.length - 1) {
      setCurrentStep((prev) => prev + 1);
      lastStepTimeRef.current = 0;
    }
  }, [currentStep, solution.length]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      lastStepTimeRef.current = 0;
    }
  }, [currentStep]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        previousStep();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextStep();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, previousStep, nextStep, reset]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme change (e.g., using CSS variables or a theme provider)
    document.body.classList.toggle('dark');
  };

  return (
    <div className={`space-y-4 bg-card p-4 rounded-lg border ${isDarkMode ? 'dark' : ''}`}> {/* Apply dark mode class */}
      <div className="flex items-center justify-between"> {/* Added space between controls and theme toggle */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            disabled={currentStep === 0}
            className="h-8 w-8"
            title="Reset (Esc)"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={previousStep}
            disabled={currentStep === 0}
            className="h-8 w-8"
            title="Previous Move (←)"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-8 w-8"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextStep}
            disabled={currentStep === solution.length - 1}
            className="h-8 w-8"
            title="Next Move (→)"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={toggleTheme} variant="ghost">
          {/* Add appropriate icon for theme toggle */}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
      <div className="flex items-center space-x-4 px-2">
        <span className="text-sm text-muted-foreground min-w-[60px]">Speed:</span>
        <Slider
          value={[speed]}
          onValueChange={([newSpeed]) => {
            setSpeed(newSpeed);
            lastStepTimeRef.current = 0; // Reset timer when speed changes
          }}
          min={0.2}
          max={3}
          step={0.1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground min-w-[60px] text-right">
          {speed.toFixed(1)}s
        </span>
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Move {currentStep + 1} of {solution.length}
      </div>
      {/* Placeholder for further optimization */}
      {/* Add code here for puzzle generation, Stockfish analysis, rating prediction, and more sophisticated animation performance improvements */}
    </div>
  );
});