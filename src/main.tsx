
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { toast } from 'sonner';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

// Enhanced error handling with detailed feedback
const ErrorFallback = ({ error }: { error: Error }) => {
  console.error('Application Error:', error);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p className="mb-4 text-gray-700">The application encountered an error. Please refresh the page or try again later.</p>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm mb-4">
          {error.message}
          {error.stack && (
            <div className="mt-2 text-xs text-gray-600">
              {error.stack.split('\n').slice(1, 4).join('\n')}
            </div>
          )}
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

// Function to check resource loading
const checkResources = () => {
  // Check if CSS is loaded
  const cssLoaded = Array.from(document.styleSheets).some(sheet => {
    try {
      return sheet.href && sheet.href.includes('index');
    } catch (e) {
      return false;
    }
  });

  // Check if important script is loaded
  const scripts = Array.from(document.scripts);
  const mainScriptLoaded = scripts.some(script => 
    script.src && (script.src.includes('main') || script.src.includes('index'))
  );

  if (!cssLoaded) {
    console.warn('CSS resources not loaded correctly');
    toast.warning('Some styles could not be loaded', {
      description: 'The application might not display correctly'
    });
  }

  if (!mainScriptLoaded) {
    console.warn('Some script resources not loaded correctly');
  }
};

try {
  // Add debugging info during initialization
  console.log('Initializing application...');
  
  // Log environment information
  const isProduction = import.meta.env.PROD;
  const baseUrl = import.meta.env.BASE_URL || '/';
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not defined');
  console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Fix for hash router in GitHub Pages
  const fixGitHubPagesRouting = () => {
    if (isProduction && !window.location.hash && window.location.pathname !== baseUrl) {
      console.log('Redirecting to hash router base path');
      window.location.replace(`${baseUrl}#${window.location.pathname.slice(baseUrl.length)}`);
      return true;
    }
    return false;
  };

  // Only render if we're not redirecting
  if (!fixGitHubPagesRouting()) {
    root.render(
      <StrictMode>
        <ErrorBoundary fallback={<ErrorFallback error={new Error('Application failed to render properly')} />}>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('Application rendered successfully');
    
    // Check if resources loaded properly after render
    window.addEventListener('load', checkResources);
  }
} catch (error) {
  console.error('Error rendering application:', error);
  root.render(<ErrorFallback error={error instanceof Error ? error : new Error('Unknown error')} />);
}
