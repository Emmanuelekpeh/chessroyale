import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Users, Trophy, Book, LogOut } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl px-0">
              <span className="hover:text-primary transition-colors">
                ChessCrunch
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/puzzles">
                <Button variant="ghost" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Puzzles
                </Button>
              </Link>
              <Link href="/tutorial/create">
                <Button variant="ghost" size="sm">
                  <Book className="h-4 w-4 mr-2" />
                  Tutorials
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu 
              onThemeChange={() => {}} 
              onOrientationChange={() => {}} 
              onSoundToggle={() => {}} 
              onHintTypeChange={() => {}} 
              currentHintType="verbal"
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}