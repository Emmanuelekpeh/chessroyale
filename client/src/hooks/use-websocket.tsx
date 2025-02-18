import { createContext, useContext, ReactNode, useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

export type WebSocketMessage = {
  type: 'friendRequest' | 'message' | 'presence' | 'activity' | 'auth';
  action: 'new' | 'accepted' | 'rejected' | 'online' | 'offline' | 'activity_update' | 'success' | 'failure';
  request?: any;
  sender?: any;
  message?: any;
  activity?: {
    type: string;
    data: any;
    timestamp: string;
  };
  status?: 'success' | 'failure';
};

type WebSocketContextType = {
  isConnected: boolean;
  hasError: boolean;
  sendMessage: (message: any) => void;
  subscribeToMessages: (handler: (message: any) => void) => () => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasError, setHasError] = useState(false);
  const messageHandlers = useRef<Set<(message: any) => void>>(new Set());

  const connect = useCallback(() => {
    if (!user?.id || socket.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      socket.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setHasError(false);
        ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          messageHandlers.current.forEach(handler => handler(message));
        } catch (error) {
          // Silently handle parsing errors
        }
      };

      ws.onerror = () => setHasError(true);
      ws.onclose = () => {
        setIsConnected(false);
        if (user?.id) {
          console.log('Connection lost, attempting to reconnect...');
          setTimeout(connect, 3000);
        }
      };
    } catch (error) {
      setHasError(true);
      toast({
        title: "Connection Error",
        description: "Failed to establish real-time connection. Some features may be limited.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribeToMessages = useCallback((handler: (message: any) => void) => {
    messageHandlers.current.add(handler);
    return () => {
      messageHandlers.current.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      hasError,
      sendMessage,
      subscribeToMessages
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('notificationPreferences');
    return saved ? JSON.parse(saved) : {
      friendStatus: false, 
      friendRequests: true,
      messages: true,
      achievements: true
    };
  });

  const updatePreference = useCallback((key: string, value: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('notificationPreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Add friend status tracking
  useEffect(() => {
    if (ws && preferences.friendStatus) {
      const interval = setInterval(() => {
        ws.send(JSON.stringify({ type: 'friend_status_check' }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [ws, preferences.friendStatus]);

  return { preferences, updatePreference };
};