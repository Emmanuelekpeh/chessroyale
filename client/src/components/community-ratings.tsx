import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  StarHalf,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { PuzzleRating, InsertPuzzleRating } from "@shared/schema";

interface CommunityRatingsProps {
  puzzleId: number;
}

export default function CommunityRatings({ puzzleId }: CommunityRatingsProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery<PuzzleRating[]>({
    queryKey: ["/api/puzzles", puzzleId, "ratings"],
  });

  const submitRatingMutation = useMutation({
    mutationFn: async (data: InsertPuzzleRating) => {
      const res = await apiRequest(
        "POST",
        `/api/puzzles/${puzzleId}/ratings`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/puzzles", puzzleId, "ratings"],
      });
      setRating(0);
      setReview("");
    },
  });

  const handleSubmit = () => {
    if (rating === 0) return;

    submitRatingMutation.mutate({
      userId: user!.id,
      puzzleId,
      rating,
      review: review.trim() || undefined,
    });
  };

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Community Feedback
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span>{averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({ratings.length})
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className="p-0 h-8 w-8"
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      value <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="Write your review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="h-24"
            />

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={rating === 0 || submitRatingMutation.isPending}
            >
              {submitRatingMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>

          <div className="space-y-4">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.review && <p className="text-sm">{r.review}</p>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
