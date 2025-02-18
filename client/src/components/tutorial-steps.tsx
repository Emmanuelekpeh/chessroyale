import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

interface Step {
  description: string;
  fen: string;
  solution: string;
}

interface TutorialStepsProps {
  steps: Step[];
  currentStep: number;
  onStepSelect: (index: number) => void;
  userProgress?: number;
}

export default function TutorialSteps({
  steps,
  currentStep,
  onStepSelect,
  userProgress,
}: TutorialStepsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutorial Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <Button
                key={index}
                variant={currentStep === index ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  currentStep === index && "bg-primary text-primary-foreground"
                )}
                onClick={() => onStepSelect(index)}
              >
                <div className="flex items-center gap-3">
                  {userProgress !== undefined ? (
                    index < userProgress ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )
                  ) : null}
                  <span>Step {index + 1}</span>
                </div>
                {step.description && (
                  <span className="ml-2 text-sm truncate">
                    {step.description}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
