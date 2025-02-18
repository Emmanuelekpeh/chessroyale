import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User as SelectUser } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  createGuestUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // Try to get existing user from localStorage
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) return null;

        const response = await fetch(`/api/users/${storedUserId}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  const createGuestUser = async () => {
    try {
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 7);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: guestId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guest user');
      }

      const newUser = await response.json();
      localStorage.setItem('userId', newUser.id.toString());
      queryClient.setQueryData(["/api/user"], newUser);

      toast({
        title: "Welcome!",
        description: "Created a new guest account for you.",
      });
    } catch (error) {
      console.error('Error creating guest user:', error);
      toast({
        title: "Error",
        description: "Failed to create guest account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        createGuestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}