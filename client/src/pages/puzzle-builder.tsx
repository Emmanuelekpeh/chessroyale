import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chess } from "chess.js";
import ChessBoard from "@/components/chess-board";
import { Brain, ArrowLeft } from "lucide-react";
import type { InsertPuzzle } from "@shared/schema";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";

export default function PuzzleBuilder() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [solution, setSolution] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [rating] = useState(1200);
  const [tacticalThemes, setTacticalThemes] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");

  const createPuzzleMutation = useMutation({
    mutationFn: async (puzzle: InsertPuzzle) => {
      return await apiRequest("POST", "/api/puzzles", puzzle);
    },
    onSuccess: () => {
      setLocation("/puzzles");
    },
  });

  const handleSubmit = () => {
    if (!isValid || !user) return;

    const puzzle: InsertPuzzle = {
      creatorId: user.id,
      fen,
      solution,
      rating,
      title,
      description,
      tacticalTheme: tacticalThemes,
      difficulty,
    };

    createPuzzleMutation.mutate(puzzle);
  };

  const addTheme = (theme: string) => {
    setTacticalThemes(prev => Array.from(new Set([...prev, theme])));
  };

  const removeTheme = (theme: string) => {
    setTacticalThemes(prev => prev.filter(t => t !== theme));
  };

  const validatePosition = (newFen: string) => {
    try {
      const game = new Chess(newFen);
      setFen(game.fen());
      setIsValid(solution.trim().length > 0);
    } catch (e) {
      setIsValid(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation("/puzzles")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Puzzles
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Create New Puzzle
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Puzzle Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Queen Sacrifice Mate in 2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the key idea of the puzzle..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tactical Themes</Label>
                  <div className="flex flex-wrap gap-2">
                    {tacticalThemes.map(theme => (
                      <Badge key={theme} variant="secondary">
                        {theme}
                        <button
                          onClick={() => removeTheme(theme)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Select onValueChange={addTheme}>
                      <SelectTrigger>
                        <Plus className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {['fork', 'pin', 'skewer', 'discovery', 'mate'].map(theme => (
                          <SelectItem key={theme} value={theme}>
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">Solution (space-separated moves)</Label>
                  <Input
                    id="solution"
                    value={solution}
                    onChange={(e) => {
                      setSolution(e.target.value);
                      setIsValid(e.target.value.trim().length > 0);
                    }}
                    placeholder="e.g., Qxf7+ Kxf7 Ne5#"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!isValid || createPuzzleMutation.isPending}
                >
                  {createPuzzleMutation.isPending ? "Creating..." : "Create Puzzle"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Position Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <ChessBoard
                  fen={fen}
                  onMove={(move) => validatePosition(move)}
                  customOptions={{
                    boardTheme: 'green',
                    showCoordinates: true,
                  }}
                />
                <div className="mt-4">
                  <Label htmlFor="fen">FEN String</Label>
                  <Input
                    id="fen"
                    value={fen}
                    onChange={(e) => validatePosition(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}