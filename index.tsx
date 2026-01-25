import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Debug: Log that the script is executing
console.log('[PetBhai] Main script started');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[PetBhai] Root element not found!');
  throw new Error('Could not find root element to mount to');
}

console.log('[PetBhai] Root element found, creating React root');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('[PetBhai] React root created, rendering app');
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
      <button onclick="location.reload()" style="background:#f97316;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;margin-top:16px;">
        Reload Page
      </button>
    </div>
  `;
}
