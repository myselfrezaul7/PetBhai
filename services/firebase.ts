import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  const hasApiKey = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key');
  const hasAuthDomain = !!firebaseConfig.authDomain;

  // Log configuration status for debugging (remove in production if desired)
  if (!hasApiKey || !hasAuthDomain) {
    console.log('Firebase config status:', {
      hasApiKey,
      hasAuthDomain,
      apiKeyLength: firebaseConfig.apiKey?.length || 0,
      authDomain: firebaseConfig.authDomain || 'not set',
    });
  }

  return hasApiKey && hasAuthDomain;
};

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    console.log('Initializing Firebase with authDomain:', firebaseConfig.authDomain);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.log('Firebase not configured - will use mock sign-in');
}

export { auth, googleProvider };
