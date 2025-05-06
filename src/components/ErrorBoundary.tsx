
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Optionally show a toast for better user experience
    toast.error("Something went wrong", {
      description: error.message || "An unexpected error occurred"
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="mb-4 text-gray-700">
              The application encountered an error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm mb-4">
                {this.state.error.message}
              </pre>
            )}
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
