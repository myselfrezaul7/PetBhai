import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PawIcon } from './icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class BlogErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Blog error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-16 text-center h-[70vh] flex flex-col items-center justify-center">
          <div className="glass-card-ios p-8 max-w-lg w-full flex flex-col items-center border border-amber-900/10 dark:border-amber-100/10 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 shadow-xl">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
              <PawIcon className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              Ops! Article Issue
            </h2>
            <p className="text-zinc-500 dark:text-zinc-300 mb-8 px-4 leading-relaxed">
              We couldn't load this article correctly. The content might be temporarily unavailable or malformed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/blog"
                onClick={this.handleReset}
                className="px-6 py-3 bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
              >
                Back to Blog
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 w-full text-left text-xs bg-red-50 dark:bg-red-900/10 p-4 rounded-lg overflow-auto max-h-32">
                <p className="text-red-600 font-mono">{this.state.error.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlogErrorBoundary;
