import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import type { User, UserPuzzleHistory } from "@shared/schema";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function ProgressDashboard({ user }: { user: User }) {
  const { data: history = [] } = useQuery<UserPuzzleHistory[]>({
    queryKey: ["/api/users", user.id, "puzzle-history"],
    enabled: !!user,
  });

  const totalPuzzles = history.length;
  const solvedPuzzles = history.filter(h => h.completed).length;
  const completionRate = (solvedPuzzles / totalPuzzles) * 100 || 0;

  // Calculate average solve time trend
  const timeData = history
    .filter(h => h.completed)
    .map(h => ({
      time: h.timeSpent,
      date: new Date(h.lastAttemptAt!).toLocaleDateString()
    }));

  const chartData = {
    labels: timeData.map(d => d.date),
    datasets: [{
      label: 'Solve Time (seconds)',
      data: timeData.map(d => d.time),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {solvedPuzzles} of {totalPuzzles} puzzles completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rating Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{user.rating}</div>
          <p className="text-sm text-muted-foreground">Current Rating</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Solve Time Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={chartData} options={{ maintainAspectRatio: false }} />
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressDashboard;