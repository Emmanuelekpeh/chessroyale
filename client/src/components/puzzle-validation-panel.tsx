import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Chess } from "chess.js";

interface ValidationPanelProps {
  fen: string;
  solution: string;
  onValidate: (isValid: boolean) => void;
  onHintGenerated?: (hint: { from: string; to: string }) => void;
}

export default function PuzzleValidationPanel({ 
  fen, 
  solution, 
  onValidate,
  onHintGenerated 
}: ValidationPanelProps) {
  const [validationResult, setValidationResult] = useState<"valid" | "invalid" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);

  useEffect(() => {
    setSolutionMoves(solution.trim().split(/\s+/));
  }, [solution]);

  const validatePuzzle = () => {
    try {
      const game = new Chess(fen);

      if (solutionMoves.length === 0 || (solutionMoves.length === 1 && solutionMoves[0] === '')) {
        setError("No solution provided");
        setValidationResult("invalid");
        onValidate(false);
        return;
      }

      // Validate all moves in the solution
      let isValid = true;
      let currentGame = new Chess(fen);

      for (let i = 0; i < solutionMoves.length; i++) {
        const move = solutionMoves[i];
        const result = currentGame.move(move);
        if (!result) {
          setError(`Invalid move in solution sequence: ${move} (move ${i + 1})`);
          isValid = false;
          break;
        }

        // Generate hint for the first move
        if (i === 0 && onHintGenerated) {
          onHintGenerated({ from: result.from, to: result.to });
        }
      }

      setValidationResult(isValid ? "valid" : "invalid");
      setError(isValid ? null : error);
      onValidate(isValid);

    } catch (e: any) {
      // More specific error handling
      if (e instanceof Error && e.message.startsWith("Invalid FEN")) {
          setError("Invalid starting position (FEN)");
      } else if (e instanceof Error) {
          setError(`An unexpected error occurred: ${e.message}`);
      } else {
          setError("An unexpected error occurred");
      }
      setValidationResult("invalid");
      onValidate(false);
    }
  };

  // Automatically validate when component mounts or solution changes
  useEffect(() => {
    validatePuzzle();
  }, [fen, solution]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Puzzle Validation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={validatePuzzle}>Validate Puzzle</Button>
            {validationResult && (
              <div className="flex items-center gap-2">
                {validationResult === "valid" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-500">Valid puzzle</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-500">Invalid puzzle</span>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
          {validationResult === "valid" && solutionMoves.length > 1 && (
            <div className="text-sm text-green-500 bg-green-50 p-2 rounded border border-green-200">
              Valid sequence of {solutionMoves.length} moves
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}