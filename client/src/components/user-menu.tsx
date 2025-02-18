import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  UserIcon,
  LogOut,
  Monitor,
  Volume2,
  VolumeX,
  Keyboard,
  Palette,
  Lightbulb,
  Users,
  UserPlus,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import type { FriendRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface UserMenuProps {
  onThemeChange: (theme: 'green' | 'brown' | 'blue') => void;
  onOrientationChange: (orientation: 'white' | 'black') => void;
  onSoundToggle: (enabled: boolean) => void;
  onHintTypeChange: (type: 'verbal' | 'directional') => void;
  currentHintType: 'verbal' | 'directional';
}

export function UserMenu({
  onThemeChange,
  onOrientationChange,
  onSoundToggle,
  onHintTypeChange,
  currentHintType,
}: UserMenuProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Get friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ['/api/friends'],
    enabled: !!user && menuOpen,
  });

  // Get friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friend-requests'],
    enabled: !!user && menuOpen,
  });

  // Calculate pending requests
  const pendingRequests = friendRequests.filter(req =>
    req.status === 'pending' && req.receiverId === user?.id
  );

  // Get sender information for pending requests
  const { data: senders = [], isLoading: sendersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: pendingRequests.length > 0 && menuOpen,
  });

  const handleFriendRequestAction = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'accept' | 'reject' }) => {
      const response = await apiRequest("POST", `/api/friend-requests/${id}/${action}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Success",
        description: "Friend request updated successfully",
      });
    },
  });

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    onSoundToggle(newState);
  };

  const shortcuts = [
    { key: 'H', action: 'Show hint' },
    { key: 'R', action: 'Reset puzzle' },
    { key: 'S', action: 'Skip puzzle' },
    { key: 'Space', action: 'Flip board' },
  ];

  const themes = [
    { value: 'green', label: 'Classic Green' },
    { value: 'brown', label: 'Wooden Brown' },
    { value: 'blue', label: 'Ocean Blue' },
    { value: 'coral', label: 'Coral Sunset' },
    { value: 'purple', label: 'Royal Purple' },
    { value: 'midnight', label: 'Midnight Blue' },
    { value: 'modern', label: 'Modern Gray' }
  ];

  // Find sender usernames for pending requests
  const getSenderUsername = (senderId: number) => {
    const sender = senders.find(s => s.id === senderId);
    return sender?.username || `User ${senderId}`;
  };

  if (!user) return null;

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-accent focus:ring-2 focus:ring-offset-2 focus:ring-ring"
        >
          <UserIcon className="h-5 w-5" />
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          className="w-64 z-[100]"
          align="end"
          sideOffset={5}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Rating: {user.rating}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Users className="mr-2 h-4 w-4" />
                <span>Friends {friendsLoading ? '' : `(${friends.length})`}</span>
                {friendsLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="z-[101]">
                  {friendsLoading ? (
                    <DropdownMenuItem>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading friends...</span>
                    </DropdownMenuItem>
                  ) : friends.length === 0 ? (
                    <DropdownMenuItem>
                      <span className="text-muted-foreground">No friends yet</span>
                    </DropdownMenuItem>
                  ) : (
                    friends.map(friend => (
                      <DropdownMenuItem key={friend.id}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>{friend.username}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {pendingRequests.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Friend Requests ({pendingRequests.length})</span>
                  {(requestsLoading || sendersLoading) &&
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  }
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="z-[101]">
                    {(requestsLoading || sendersLoading) ? (
                      <DropdownMenuItem>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading requests...</span>
                      </DropdownMenuItem>
                    ) : (
                      pendingRequests.map(request => (
                        <DropdownMenuItem key={request.id} className="flex items-center justify-between p-2">
                          <span className="text-sm">{getSenderUsername(request.senderId)}</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleFriendRequestAction.mutate({ id: request.id, action: 'accept' })}
                              disabled={handleFriendRequestAction.isPending}
                            >
                              {handleFriendRequestAction.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleFriendRequestAction.mutate({ id: request.id, action: 'reject' })}
                              disabled={handleFriendRequestAction.isPending}
                            >
                              {handleFriendRequestAction.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Board Theme</DropdownMenuLabel>
            {themes.map(theme => (
              <DropdownMenuItem key={theme.value} onClick={() => onThemeChange(theme.value as any)}>
                <Palette className="mr-2 h-4 w-4" />
                <span>{theme.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Board</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onOrientationChange('white')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>White Side</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrientationChange('black')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Black Side</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSoundToggle}>
              {soundEnabled ? (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="mr-2 h-4 w-4" />
                  <span>Sound Off</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Hint Type</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onHintTypeChange('verbal')} className={currentHintType === 'verbal' ? 'bg-accent' : ''}>
              <Lightbulb className="mr-2 h-4 w-4" />
              <span>Verbal Hints</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHintTypeChange('directional')} className={currentHintType === 'directional' ? 'bg-accent' : ''}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Visual Hints</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
            {shortcuts.map(({ key, action }) => (
              <DropdownMenuItem key={key}>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>{action}</span>
                <span className="ml-auto text-xs">{key}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            {logoutMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}