import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useAuth } from '@/hooks/use-auth';

interface ChatMessage {
  userId: number;
  message: string;
  timestamp: string;
}

interface GameChatProps {
  gameId: number;
}

export default function GameChat({ gameId }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { user } = useAuth();
  const { sendMessage, subscribeToMessages } = useWebSocket(gameId, user?.id);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    subscribeToMessages((message) => {
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, message.payload]);
      }
    });
  }, [subscribeToMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    sendMessage({
      type: 'chat_message',
      payload: {
        message: inputMessage.trim()
      }
    });

    setInputMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Game Chat</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div ref={scrollAreaRef} className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.userId === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      msg.userId === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
