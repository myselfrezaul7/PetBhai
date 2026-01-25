import React from 'react';
import ReactDOM from 'react-dom/client';
// Temporarily comment out to test if the issue is in App or elsewhere
// import App from './App';
// import ErrorBoundary from './components/ErrorBoundary';

// Global error handler to catch any unhandled errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error('[PetBhai] Global error:', { message, source, lineno, colno, error });
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `
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

window.onunhandledrejection = function (event) {
  console.error('[PetBhai] Unhandled promise rejection:', event.reason);
};

// Debug: Log that the script is executing
console.log('[PetBhai] MINIMAL TEST - Main script started at', new Date().toISOString());

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[PetBhai] Root element not found!');
  throw new Error('Could not find root element to mount to');
}

console.log('[PetBhai] Root element found, testing minimal render...');

// Minimal test component - no dependencies
const TestApp = () => {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f8fafc',
      },
    },
    [
      React.createElement(
        'h1',
        { key: 'title', style: { color: '#f97316', marginBottom: '16px' } },
        '✅ React is Working!'
      ),
      React.createElement(
        'p',
        { key: 'info', style: { color: '#64748b' } },
        `React ${React.version} loaded successfully at ${new Date().toLocaleTimeString()}`
      ),
      React.createElement(
        'p',
        { key: 'note', style: { color: '#94a3b8', fontSize: '14px', marginTop: '8px' } },
        'This is a minimal test. Full app will load after verification.'
      ),
      React.createElement(
        'button',
        {
          key: 'btn',
          onClick: () => {
            window.location.reload();
          },
          style: {
            marginTop: '24px',
            padding: '12px 24px',
            background: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          },
        },
        'Reload Page'
      ),
    ]
  );
};

try {
  console.log('[PetBhai] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('[PetBhai] Rendering minimal test app...');
  root.render(React.createElement(TestApp));
  console.log('[PetBhai] Minimal render complete!');
} catch (error) {
  console.error('[PetBhai] Error during render:', error);
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
