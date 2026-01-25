import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const BUILD_VERSION = '2026-01-25-v3';
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(`Could not find root element - build ${BUILD_VERSION}`);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
