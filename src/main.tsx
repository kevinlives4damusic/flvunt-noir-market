
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

// Error boundary for the entire app
const ErrorFallback = ({ error }: { error: Error }) => {
  console.error('Application Error:', error);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p className="mb-4 text-gray-700">The application encountered an error. Please refresh the page or try again later.</p>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm mb-4">
          {error.message}
        </pre>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

try {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Error rendering application:', error);
  root.render(<ErrorFallback error={error instanceof Error ? error : new Error('Unknown error')} />);
}
