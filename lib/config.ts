// Environment Configuration
// Centralized environment variable access with validation and defaults

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  aiProxyUrl: string;

  // Feature Flags
  isProduction: boolean;
  isDevelopment: boolean;
  isDebugMode: boolean;

  // App Settings
  appName: string;
  appVersion: string;

  // External Services
  firebaseApiKey: string | null;
  firebaseAuthDomain: string | null;
  firebaseProjectId: string | null;

  // Analytics
  googleAnalyticsId: string | null;
}

// Helper to safely get env variables
const getEnv = (key: string, defaultValue = ''): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : defaultValue;
};

// Helper to check if value is a placeholder
const isPlaceholder = (value: string): boolean => {
  if (!value) return true;
  return (
    value.startsWith('your_') ||
    value.startsWith('YOUR_') ||
    value.includes('placeholder') ||
    value.includes('PLACEHOLDER') ||
    value === 'undefined' ||
    value === 'null'
  );
};

// Get optional env (returns null if placeholder or empty)
const getOptionalEnv = (key: string): string | null => {
  const value = getEnv(key);
  return isPlaceholder(value) ? null : value;
};

// Create configuration object
const createConfig = (): EnvConfig => {
  const nodeEnv = getEnv('MODE', 'development');
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';

  return {
    // API Configuration
    apiUrl: getEnv('VITE_API_URL', '/api'),
    aiProxyUrl: getEnv('VITE_AI_PROXY_URL', '/api/ai'),

    // Feature Flags
    isProduction,
    isDevelopment,
    isDebugMode: getEnv('VITE_DEBUG', 'false') === 'true' || isDevelopment,

    // App Settings
    appName: 'PetBhai',
    appVersion: getEnv('VITE_APP_VERSION', '1.0.0'),

    // External Services (optional)
    firebaseApiKey: getOptionalEnv('VITE_FIREBASE_API_KEY'),
    firebaseAuthDomain: getOptionalEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    firebaseProjectId: getOptionalEnv('VITE_FIREBASE_PROJECT_ID'),

    // Analytics (optional)
    googleAnalyticsId: getOptionalEnv('VITE_GA_ID'),
  };
};

// Export singleton config
export const config = createConfig();

// Utility functions
export const isFeatureEnabled = (feature: string): boolean => {
  const key = `VITE_FEATURE_${feature.toUpperCase()}`;
  return getEnv(key, 'false') === 'true';
};

export const isFirebaseConfigured = (): boolean => {
  return !!(config.firebaseApiKey && config.firebaseAuthDomain && config.firebaseProjectId);
};

export const isAnalyticsEnabled = (): boolean => {
  return config.isProduction && !!config.googleAnalyticsId;
};

// Debug helper
export const logConfig = (): void => {
  if (!config.isDebugMode) return;

  console.group('🔧 PetBhai Configuration');
  console.log('Environment:', config.isProduction ? 'Production' : 'Development');
  console.log('API URL:', config.apiUrl);
  console.log('Firebase:', isFirebaseConfigured() ? 'Configured' : 'Not Configured');
  console.log('Analytics:', isAnalyticsEnabled() ? 'Enabled' : 'Disabled');
  console.groupEnd();
};

// Initialize logging in development
if (config.isDevelopment) {
  logConfig();
}

export default config;
