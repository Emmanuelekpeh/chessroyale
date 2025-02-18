
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";

export function DailyChallenge() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState(0);
  
  useEffect(() => {
    if (user) {
      // Load progress from API
      // For now using mock data
      setProgress(2);
      setReward(100);
    }
  }, [user]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daily Challenge</span>
          <span className="text-sm text-muted-foreground">
            {progress}/5 completed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress * 20} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Complete all challenges to earn {reward} rating points!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
