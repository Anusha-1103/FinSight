import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-extrabold text-slate-100">Something went wrong</h2>
          <p className="text-xs text-slate-400 max-w-md">
            The workspace encountered an unexpected interface boundary exception. Please refresh to restore calm balance.
          </p>
          <Button onClick={() => window.location.reload()} size="sm">
            Reload Workspace
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
