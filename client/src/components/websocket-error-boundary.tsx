
import { Component, type ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error) {
    console.error('WebSocket error:', error);
    if (this.state.retryCount < this.maxRetries) {
      const backoffTime = Math.min(Math.pow(2, this.state.retryCount) * 1000, 10000);
      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({ 
          hasError: false, 
          error,
          retryCount: prev.retryCount + 1 
        }));
      }, backoffTime);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {this.state.retryCount < this.maxRetries ? (
              <>Attempting to reconnect... ({this.maxRetries - this.state.retryCount} attempts remaining)</>
            ) : (
              <>
                Connection failed after {this.maxRetries} attempts.
                <Button onClick={this.handleRetry} className="mt-2">
                  Retry Connection
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
