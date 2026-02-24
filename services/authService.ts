import { signInWithPopup } from 'firebase/auth';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from './firebase';

interface SocialUser {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  firebaseToken?: string;
  providerUserId?: string;
}

export const signInWithGoogle = async (): Promise<SocialUser> => {
  // Require Firebase to be properly configured
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error('Google Sign-In is not available. Firebase is not configured.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get Firebase ID token for backend verification
    let firebaseToken: string | undefined;
    try {
      firebaseToken = await user.getIdToken();
    } catch {
      // Token retrieval failed — proceed without it (local session only)
    }

    // Extract name parts
    const displayName = user.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      email: user.email || '',
      photoUrl: user.photoURL || undefined,
      firebaseToken,
      providerUserId: user.uid || undefined,
    };
  } catch (error: unknown) {
    console.error('Google Sign-In Error (full):', error);
    const firebaseError = error as { code?: string; message?: string };
    console.error('Error code:', firebaseError.code);
    console.error('Error message:', firebaseError.message);

    // Provide user-friendly error messages
    switch (firebaseError.code) {
      case 'auth/api-key-not-valid-please-pass-a-valid-api-key':
        throw new Error(
          'Firebase API key is invalid. Please check your Vercel environment variables.'
        );
      case 'auth/unauthorized-domain':
        throw new Error(
          `Domain "${window.location.hostname}" is not authorized. Add it to Firebase Console > Authentication > Settings > Authorized domains.`
        );
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled.');
      case 'auth/popup-blocked':
        throw new Error('Sign-in popup was blocked. Please allow popups for this site.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/internal-error':
        throw new Error(
          'Firebase internal error. Check that API key and Auth Domain are correct in Vercel.'
        );
      case 'auth/operation-not-allowed':
        throw new Error(
          'Google Sign-In is not enabled. Enable it in Firebase Console > Authentication > Sign-in method.'
        );
      case 'auth/invalid-api-key':
        throw new Error('Invalid Firebase API key. Please verify VITE_FIREBASE_API_KEY in Vercel.');
      default:
        throw new Error(
          `Sign-in failed: ${firebaseError.message || firebaseError.code || 'Unknown error'}`
        );
    }
  }
};

/**
 * Send a password reset email to the specified email address
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  if (!email || !email.trim()) {
    throw new Error('Email address is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  await firebaseSendPasswordResetEmail(email.trim().toLowerCase());
};
