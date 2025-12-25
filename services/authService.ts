import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

interface SocialUser {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

export const signInWithGoogle = async (): Promise<SocialUser> => {
  console.log('signInWithGoogle called');
  console.log('isFirebaseConfigured:', isFirebaseConfigured());
  console.log('auth exists:', !!auth);
  console.log('googleProvider exists:', !!googleProvider);

  // Fallback to Mock if Firebase is not configured
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    console.warn('Firebase not configured. Using Mock Google Sign-In.');
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
    return {
      firstName: 'Israt',
      lastName: 'Jahan',
      email: 'israt.google@example.com',
      photoUrl: 'https://picsum.photos/seed/mockuser/200', // Better mock photo
    };
  }

  try {
    console.log('Attempting Firebase signInWithPopup...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('signInWithPopup successful');
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
