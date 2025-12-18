
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Fix: "Property 'props' does not exist on type 'ErrorBoundary'"
// Explicitly extending React.Component and using a constructor ensures props are available in the instance.
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-center px-4 font-sans">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Something went wrong</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md">
            We're sorry, but an unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-4">
             <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-transform active:scale-95 shadow-lg"
            >
                Refresh Page
            </button>
            <button
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-8 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-transform active:scale-95"
            >
                Clear Cache & Restart
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
