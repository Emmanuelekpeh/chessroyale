import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { MessageSquare, Send } from "lucide-react";

interface Message {
  id: string;
  userId: number;
  username: string;
  content: string;
  timestamp: Date;
}

interface GameChatProps {
  gameId: number;
}

export default function GameChat({ gameId }: GameChatProps) {
  const { user } = useAuth();
  const { sendMessage, subscribeToMessages } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = subscribeToMessages((message) => {
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, message.payload]);
      }
    });

    return () => cleanup();
  }, [subscribeToMessages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      id: crypto.randomUUID(),
      userId: user!.id,
      username: user!.username,
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    sendMessage({
      type: 'chat_message',
      payload: messageData,
    });

    setMessages(prev => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.userId === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.userId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.userId !== user?.id && (
                      <div className="text-xs font-medium mb-1">
                        {msg.username}
                      </div>
                    )}
                    <div>{msg.content}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
