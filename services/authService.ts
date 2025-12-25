import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

interface SocialUser {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

export const signInWithGoogle = async (): Promise<SocialUser> => {
  // Fallback to Mock if no API key is configured
  if (
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key'
  ) {
    console.warn('Firebase API Key not found. Using Mock Google Sign-In.');
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
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/api-key-not-valid-please-pass-a-valid-api-key') {
      throw new Error('Google Sign-In is not configured. Please set VITE_FIREBASE_API_KEY in .env');
    }
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};
