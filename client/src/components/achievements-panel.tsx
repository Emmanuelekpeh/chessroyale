import { Trophy, Medal, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  earned: boolean;
}

export default function AchievementsPanel({ userId }: { userId: number }) {
  const achievements: Achievement[] = [
    {
      id: "first_win",
      title: "First Victory",
      description: "Complete your first puzzle successfully",
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      earned: true
    },
    {
      id: "speed_demon",
      title: "Speed Demon",
      description: "Solve a puzzle in under 30 seconds",
      icon: <Star className="w-6 h-6 text-blue-500" />,
      earned: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                achievement.earned ? "bg-secondary" : "bg-muted"
              }`}
            >
              {achievement.icon}
              <div>
                <h3 className="font-medium">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}