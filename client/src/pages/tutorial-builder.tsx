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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChessBoard from "@/components/chess-board";
import TutorialSteps from "@/components/tutorial-steps";
import { GraduationCap, ArrowLeft, Plus } from "lucide-react";
import type { InsertTutorial } from "@shared/schema";

interface Step {
  description: string;
  fen: string;
  solution: string;
}

export default function TutorialBuilder() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [steps, setSteps] = useState<Step[]>([
    {
      description: "",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      solution: "",
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const createTutorialMutation = useMutation({
    mutationFn: async (tutorial: InsertTutorial) => {
      const res = await apiRequest("POST", "/api/tutorials", tutorial);
      return await res.json();
    },
    onSuccess: () => {
      setLocation("/");
    },
  });

  const handleSubmit = () => {
    const tutorial: InsertTutorial = {
      creatorId: user!.id,
      title,
      description,
      difficulty,
      steps: steps.map(s => s.description),
      fens: steps.map(s => s.fen),
      solutions: steps.map(s => s.solution),
    };

    createTutorialMutation.mutate(tutorial);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        description: "",
        fen: steps[steps.length - 1].fen,
        solution: "",
      },
    ]);
    setCurrentStep(steps.length);
  };

  const updateStep = (index: number, updates: Partial<Step>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Create Tutorial
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Tutorial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Basic Checkmate Patterns"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide an overview of the tutorial..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
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

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createTutorialMutation.isPending}
                >
                  {createTutorialMutation.isPending
                    ? "Creating..."
                    : "Create Tutorial"}
                </Button>
              </CardContent>
            </Card>

            <TutorialSteps
              steps={steps}
              currentStep={currentStep}
              onStepSelect={setCurrentStep}
            />

            <Button onClick={addStep} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Step {currentStep + 1} Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={steps[currentStep].description}
                    onChange={(e) =>
                      updateStep(currentStep, { description: e.target.value })
                    }
                    placeholder="Explain this step..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Solution</Label>
                  <Input
                    value={steps[currentStep].solution}
                    onChange={(e) =>
                      updateStep(currentStep, { solution: e.target.value })
                    }
                    placeholder="Required moves (space-separated)"
                  />
                </div>

                <ChessBoard
                  fen={steps[currentStep].fen}
                  onMove={(fen) => updateStep(currentStep, { fen })}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}