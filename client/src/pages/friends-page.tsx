import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, FriendRequest, UserActivity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { WebSocketErrorBoundary } from "@/components/websocket-error-boundary";
import {
  Check,
  X,
  UserPlus,
  Loader2,
  MessageSquare,
  User as UserIcon,
  Search,
  Trophy,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Separate WebSocket-dependent component
function FriendsList({ friends }: { friends: User[] }) {
  const { isConnected } = useWebSocket();

  return (
    <div className="grid gap-4">
      <AnimatePresence>
        {friends.map((friend) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <UserIcon className="h-8 w-8" />
                    <div
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                        friend.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                      title={friend.isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Rating: {friend.rating}
                      </p>
                      {friend.currentActivity && (
                        <p className="text-sm text-muted-foreground">
                          • {friend.currentActivity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Get users for search
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<User[]>({
    queryKey: ["/api/users", debouncedSearch],
    enabled: !!user && !!debouncedSearch,
  });

  // Get friends list with online status
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });

  // Get friend activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<UserActivity[]>({
    queryKey: ["/api/friend-activities"],
    enabled: !!user,
  });

  // Get friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friend-requests"],
    enabled: !!user,
  });

  const pendingRequests = friendRequests.filter((req) => req.status === "pending" && req.receiverId === user?.id);
  const sentRequests = friendRequests.filter((req) => req.status === "pending" && req.senderId === user?.id);

  // Get sender information for pending requests
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const handleFriendRequestAction = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "accept" | "reject" }) => {
      const response = await apiRequest("POST", `/api/friend-requests/${id}/${action}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", "/api/friend-requests", {
        receiverId: userId,
      });
      return await response.json();
    },
    onSuccess: (_, userId) => {
      const targetUser = users.find((u) => u.id === userId);
      toast({
        title: "Friend request sent",
        description: `Friend request sent to ${targetUser?.username}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const isRequestSent = (userId: number) => sentRequests.some((req) => req.receiverId === userId);
  const isAlreadyFriend = (userId: number) => friends.some((friend) => friend.id === userId);

  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "game_won":
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "tutorial_completed":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Friends List with Error Boundary */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold">Friends</h2>
          {friendsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-muted-foreground">No friends yet</p>
          ) : (
            <WebSocketErrorBoundary>
              <FriendsList friends={friends} />
            </WebSocketErrorBoundary>
          )}
        </div>

        {/* Friend Activities and Search */}
        <div className="space-y-8">
          {/* Friend Activities */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Friend Activity</h2>
            {activitiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {getActivityIcon(activity.activityType)}
                      <div className="flex-1">
                        <p className="text-sm">{activity.activityData}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt || ""), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Search Users */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Find Friends</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <div className="mt-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-muted-foreground">No users found</p>
                ) : (
                  <div className="grid gap-4">
                    {searchResults.map((foundUser) => (
                      <Card key={foundUser.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-8 w-8" />
                            <p className="font-medium">{foundUser.username}</p>
                          </div>
                          {!isAlreadyFriend(foundUser.id) && (
                            <Button
                              size="sm"
                              variant={isRequestSent(foundUser.id) ? "secondary" : "default"}
                              onClick={() => sendFriendRequest.mutate(foundUser.id)}
                              disabled={isRequestSent(foundUser.id) || sendFriendRequest.isPending}
                            >
                              {sendFriendRequest.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isRequestSent(foundUser.id) ? (
                                "Request Sent"
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Add Friend
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Friend Requests */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Friend Requests</h2>
            {requestsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-muted-foreground">No pending friend requests</p>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => {
                  const sender = users.find((u) => u.id === request.senderId);
                  return (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-8 w-8" />
                          <p className="font-medium">{sender?.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleFriendRequestAction.mutate({
                                id: request.id,
                                action: "accept",
                              })
                            }
                            disabled={handleFriendRequestAction.isPending}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleFriendRequestAction.mutate({
                                id: request.id,
                                action: "reject",
                              })
                            }
                            disabled={handleFriendRequestAction.isPending}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}