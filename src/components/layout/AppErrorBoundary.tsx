import React from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { logError } from '../../utils/errorHandling';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, 'UI Error');
    // We can also include component stack in future IPC logging
    // eslint-disable-next-line no-console
    console.error('[DevTools Error Stack]', info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    // Simple recovery: reload renderer
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-app-gradient text-foreground px-6 text-center space-y-4">
          <div className="text-2xl font-semibold">
            Something went wrong in the UI.
          </div>
          <p className="text-sm text-foreground-muted max-w-md">
            The app hit an unexpected error. You can try reloading the window.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors shadow-md"
          >
            Reload DevTools
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


