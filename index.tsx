import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler to catch any unhandled errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('[PetBhai] Global error:', { message, source, lineno, colno, error });
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif;">
        <h1 style="color:#ef4444;">JavaScript Error</h1>
        <p>${message}</p>
        <p style="font-size:12px;color:#64748b;">Source: ${source}:${lineno}:${colno}</p>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#f97316;color:white;border:none;border-radius:8px;cursor:pointer;">Reload</button>
      </div>
    `;
  }
  return true;
};

window.onunhandledrejection = function(event) {
  console.error('[PetBhai] Unhandled promise rejection:', event.reason);
};

// Debug: Log that the script is executing
console.log('[PetBhai] Main script started at', new Date().toISOString());
console.log('[PetBhai] React version:', React.version);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[PetBhai] Root element not found!');
  throw new Error('Could not find root element to mount to');
}

console.log('[PetBhai] Root element found:', rootElement);

// First, clear the loading content to prove React is working
rootElement.innerHTML =
  '<div style="padding:20px;text-align:center;"><h1>React is initializing...</h1></div>';

try {
  console.log('[PetBhai] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('[PetBhai] React root created, rendering app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('[PetBhai] Render called successfully');
} catch (error) {
  console.error('[PetBhai] Error during render:', error);
  // Show error in the UI
  rootElement.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:20px;text-align:center;">
      <h1 style="color:#ef4444;margin-bottom:16px;">Failed to Load Application</h1>
      <p style="color:#64748b;margin-bottom:8px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <pre style="background:#f1f5f9;padding:12px;border-radius:8px;text-align:left;max-width:600px;overflow:auto;font-size:12px;">${error instanceof Error ? error.stack : ''}</pre>
      <button onclick="location.reload()" style="background:#f97316;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:16px;">
        Reload Page
      </button>
    </div>
  `;
}
