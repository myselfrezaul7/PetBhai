import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

interface SocialUser {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

export const signInWithGoogle = async (): Promise<SocialUser> => {
  // Fallback to Mock if Firebase is not configured
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    console.warn('Firebase not configured. Using Mock Google Sign-In.');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    return {
      firstName: 'Israt',
      lastName: 'Jahan',
      email: 'israt.google@example.com',
      photoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocIq8j...=s96-c', // Mock photo
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

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
    };
  } catch (error: unknown) {
    console.error('Google Sign-In Error:', error);
    const firebaseError = error as { code?: string; message?: string };
    
    // Provide user-friendly error messages
    switch (firebaseError.code) {
      case 'auth/api-key-not-valid-please-pass-a-valid-api-key':
        throw new Error('Firebase API key is invalid. Please check configuration.');
      case 'auth/unauthorized-domain':
        throw new Error(`This domain is not authorized for Google Sign-In. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains.`);
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled.');
      case 'auth/popup-blocked':
        throw new Error('Sign-in popup was blocked. Please allow popups for this site.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
      case 'auth/internal-error':
        throw new Error('Firebase internal error. Please check if API key and Auth Domain are correct.');
      default:
        throw new Error(firebaseError.message || `Sign-in failed (${firebaseError.code || 'unknown error'})`);
    }
  }
};
