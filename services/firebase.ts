import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
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
let analytics: Analytics | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    console.log('Initializing Firebase with authDomain:', firebaseConfig.authDomain);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);

    if (typeof window !== 'undefined') {
      void isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      });
    }

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.log('Firebase not configured - Google Sign-In is unavailable');
}

export { app, auth, googleProvider, analytics, db };

/**
 * Send a password reset email to the specified email address
 * Uses Firebase Auth's built-in password reset functionality
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured. Password reset is unavailable.');
  }

  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error('Password reset error:', firebaseError);

    switch (firebaseError.code) {
      case 'auth/user-not-found':
        // For security, don't reveal if user exists or not
        // Just return success silently
        return;
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/too-many-requests':
        throw new Error('Too many requests. Please try again later.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      default:
        throw new Error('Failed to send password reset email. Please try again.');
    }
  }
};
