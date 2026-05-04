import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ errorInfo });

    // You could send error to a logging service here
    // logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleClearAndReload = () => {
    try {
      // Only clear petbhai-related items, not all safeStorage
      const keysToRemove: string[] = [];
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('petbhai_')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((key) => safeStorage.removeItem(key));
    } catch (e) {
      // safeStorage might be disabled
      console.error('Failed to clear safeStorage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-center px-4 font-sans">
          <div className="w-32 h-32 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-amber-500 animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.686 2 6 4.686 6 8C6 11.314 12 22 12 22C12 22 18 11.314 18 8C18 4.686 15.314 2 12 2ZM10.5 6.5C11.328 6.5 12 7.172 12 8C12 8.828 11.328 9.5 10.5 9.5C9.672 9.5 9 8.828 9 8C9 7.172 9.672 6.5 10.5 6.5ZM13.5 6.5C14.328 6.5 15 7.172 15 8C15 8.828 14.328 9.5 13.5 9.5C12.672 9.5 12 8.828 12 8C12 7.172 12.672 6.5 13.5 6.5ZM10.5 11C11.328 11 12 11.672 12 12.5C12 13.328 11.328 14 10.5 14C9.672 14 9 13.328 9 12.5C9 11.672 9.672 11 10.5 11ZM13.5 11C14.328 11 15 11.672 15 12.5C15 13.328 14.328 14 13.5 14C12.672 14 12 13.328 12 12.5C12 11.672 12.672 11 13.5 11Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            Oops! A wild bug appeared! 🐾
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md text-lg">
            Our server hamsters got a little tired, or a kitty walked across our master keyboard. Our best dogs are fetching a fix! 🐕
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-6 text-left max-w-lg w-full">
              <summary className="cursor-pointer text-red-500 font-semibold mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="bg-slate-800 text-red-300 p-4 rounded-lg overflow-auto text-xs max-h-48">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-600 transition-transform active:scale-95 shadow-lg"
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleReset}
              className="bg-amber-500 text-white font-bold py-3 px-8 rounded-full hover:bg-amber-600 transition-transform active:scale-95 shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={this.handleClearAndReload}
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
