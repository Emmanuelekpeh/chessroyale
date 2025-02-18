import { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HintPanelProps {
  solution: string;
  hintsAvailable: number;
  onUseHint?: () => void;
  disabled?: boolean;
}

const HintPanel = memo(function HintPanel({ 
  solution, 
  hintsAvailable, 
  onUseHint,
  disabled = false
}: HintPanelProps) {
  const [showHint, setShowHint] = useState(false);
  const { toast } = useToast();

  // Get first move as hint
  const hint = solution.split(' ')[0] || '';

  const handleShowHint = useCallback(() => {
    if (hintsAvailable <= 0) {
      toast({
        title: "No hints available",
        description: "Try solving the puzzle without hints to earn more points!",
        variant: "destructive",
      });
      return;
    }

    setShowHint(true);
    onUseHint?.();
  }, [hintsAvailable, onUseHint, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          <span>Hint</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Hints Available
            </span>
            <span className="font-mono">{hintsAvailable}</span>
          </div>

          {showHint ? (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono">{hint}</p>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleShowHint}
              disabled={disabled || hintsAvailable <= 0}
            >
              Show Next Move
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Solve without hints for maximum points</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <X className="h-4 w-4 text-red-500" />
              <span>Using hints reduces puzzle points</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default HintPanel;