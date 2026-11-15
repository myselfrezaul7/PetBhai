import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from './firebase';

interface NativeGoogleAuthPluginInterface {
  signIn(): Promise<{
    idToken: string;
    email: string;
    displayName: string;
    givenName: string;
    familyName: string;
    photoUrl: string;
    userId: string;
  }>;
  signOut(): Promise<{ success: boolean }>;
}

const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPluginInterface>('NativeGoogleAuth');

export const signOutNativeGoogle = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeGoogleAuth.signOut();
    } catch (e) {
      console.warn('Native Google sign out error:', e);
    }
  }
};

interface SocialUser {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  firebaseToken?: string;
  providerUserId?: string;
}

export const signInWithGoogle = async (): Promise<SocialUser> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const nativeAccount = await NativeGoogleAuth.signIn();
      if (!nativeAccount || !nativeAccount.idToken) {
        throw new Error('Google Sign-In failed: No ID token returned from Google Play Services.');
      }

      let firebaseToken: string | undefined = nativeAccount.idToken;
      let firebaseUid: string | undefined = nativeAccount.userId;

      // Exchange native Google ID token for Firebase credentials if Firebase is available
      if (auth) {
        try {
          const credential = GoogleAuthProvider.credential(nativeAccount.idToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;
          firebaseUid = user.uid;
          try {
            firebaseToken = await user.getIdToken(true);
          } catch {
            firebaseToken = await user.getIdToken();
          }
        } catch (firebaseErr) {
          console.warn(
            'Firebase signInWithCredential warning (proceeding with native token):',
            firebaseErr
          );
        }
      }

      const displayName = nativeAccount.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nativeAccount.givenName || nameParts[0] || 'User';
      const lastName = nativeAccount.familyName || nameParts.slice(1).join(' ') || '';

      return {
        firstName,
        lastName,
        email: nativeAccount.email || '',
        photoUrl: nativeAccount.photoUrl || undefined,
        firebaseToken,
        providerUserId: firebaseUid || nativeAccount.userId || undefined,
      };
    } catch (error: any) {
      console.error('Native Google Sign-In Error:', error);
      const msg = error?.message || String(error);
      if (msg.includes('cancelled') || msg.includes('12501')) {
        throw new Error('Sign-in was cancelled.');
      }
      if (msg.includes('code 10') || msg.includes('Configuration error')) {
        throw new Error(
          'Google Play Services configuration error (Code 10). Please ensure SHA-1 fingerprint is registered in Firebase.'
        );
      }
      throw new Error(msg);
    }
  }

  // Require Firebase to be properly configured
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error('Google Sign-In is not available. Firebase is not configured.');
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Google Sign-In request timed out. Please try again.'));
      }, 15000);
    });

    const result = await Promise.race([signInWithPopup(auth, googleProvider), timeoutPromise]);
    const user = result.user;

    // Get fresh Firebase ID token for backend verification (force refresh to avoid stale cached tokens)
    let firebaseToken: string | undefined;
    try {
      firebaseToken = await user.getIdToken(true);
    } catch {
      try {
        firebaseToken = await user.getIdToken();
      } catch {
        // Token retrieval failed — proceed without it (local session only)
      }
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
    const firebaseError = error as {
      code?: string;
      message?: string;
      customData?: {
        _tokenResponse?: { error?: { message?: string } };
        originalError?: { message?: string };
        [key: string]: any;
      };
    };
    console.error('Error code:', firebaseError.code);
    console.error('Error message:', firebaseError.message);
    if (firebaseError.customData) {
      console.error('Error customData:', firebaseError.customData);
    }

    const rawDetail =
      firebaseError.customData?._tokenResponse?.error?.message ||
      firebaseError.customData?.originalError?.message;

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
          `Firebase internal error${rawDetail ? ` (${rawDetail})` : ''}. Check Google Sign-In setup in Firebase Console, Authorized Domains, and Google Cloud API restrictions.`
        );
      case 'auth/operation-not-allowed':
        throw new Error(
          'Google Sign-In is not enabled. Enable it in Firebase Console > Authentication > Sign-in method.'
        );
      case 'auth/invalid-api-key':
        throw new Error('Invalid Firebase API key. Please verify VITE_FIREBASE_API_KEY in Vercel.');
      default:
        throw new Error(
          `Sign-in failed: ${rawDetail || firebaseError.message || firebaseError.code || 'Unknown error'}`
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
