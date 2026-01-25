import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

console.log('[PetBhai] Starting app initialization...');

const BUILD_VERSION = '2026-01-25-v3';
const rootElement = document.getElementById('root');
console.log('[PetBhai] Root element found:', !!rootElement);

if (!rootElement) {
  throw new Error(`Could not find root element - build ${BUILD_VERSION}`);
}

console.log('[PetBhai] Creating React root...');
const root = ReactDOM.createRoot(rootElement);

console.log('[PetBhai] Rendering app...');
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
console.log('[PetBhai] Render called successfully');
