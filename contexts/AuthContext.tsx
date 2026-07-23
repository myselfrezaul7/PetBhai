import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, Order } from '../types';
import { sanitizeInput, validateId } from '../lib/security';
import { apiRequest, ApiRequestError, getErrorMessage } from '../services/apiClient';
import { useToast } from './ToastContext';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const TOKEN_STORAGE_KEY = 'petbhai_token';
const REFRESH_TOKEN_STORAGE_KEY = 'petbhai_refresh_token';
const TOKEN_EXPIRY_SKEW_MS = 30_000;
const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  emailVerificationRequired?: boolean;
}

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

const isAdminEmail = (email?: string): boolean => {
  return typeof email === 'string' && email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
};

const clearAuthStorage = () => {
  try {
    safeStorage.removeItem(TOKEN_STORAGE_KEY);
    safeStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    safeStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  } catch {
    // safeStorage might be disabled
  }
};

const getStoredToken = (): string | null => {
  try {
    return safeStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const getStoredRefreshToken = (): string | null => {
  try {
    return safeStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = window.atob(padded);
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const isLikelyJwt = (token: string): boolean => {
  return token.split('.').length === 3;
};

const isTokenExpired = (token: string): boolean => {
  if (!isLikelyJwt(token)) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const expiryMs = payload.exp * 1000;
  return expiryMs <= Date.now() + TOKEN_EXPIRY_SKEW_MS;
};

const getInitialCurrentUser = (): User | null => {
  try {
    const user = safeStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (user) {
      const parsed = JSON.parse(user);
      // Validate basic user structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        (typeof parsed.id === 'number' || typeof parsed.id === 'string') &&
        typeof parsed.email === 'string'
      ) {
        return parsed;
      }
      // Clear invalid data
      console.warn('Invalid current user data in safeStorage, clearing');
      safeStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    return null;
  } catch (error) {
    console.error('Error reading current user from safeStorage', error);
    try {
      safeStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch {
      // safeStorage might be disabled
    }
    return null;
  }
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    recaptchaToken?: string,
    captchaFallback?: {
      type: 'math-v1';
      left: number;
      right: number;
      operator: '+' | '-';
      answer: number;
    }
  ) => Promise<User>;
  logout: () => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    recaptchaToken?: string,
    captchaFallback?: {
      type: 'math-v1';
      left: number;
      right: number;
      operator: '+' | '-';
      answer: number;
    }
  ) => Promise<User>;
  socialLogin: (socialUser: {
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
    firebaseToken?: string;
    providerUserId?: string;
  }) => Promise<User>;
  fetchProfile: () => Promise<User>;
  updateProfile: (updatedData: {
    name?: string;
    profilePictureUrl?: string;
    phone?: string;
    bio?: string;
    defaultShippingAddress?: {
      fullName: string;
      address: string;
      city: string;
      phone: string;
    };
  }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  addOrderToHistory: (order: Order) => void;
  favoritePet: (animalId: number) => void;
  unfavoritePet: (animalId: number) => void;
  subscribeToPlus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialCurrentUser);
  const toast = useToast();

  const wishlistMutationRef = useRef(false);
  const inFlightWishlist = useRef<Set<number>>(new Set());
  const inFlightFavorites = useRef<Set<number>>(new Set());
  const inFlightSubscription = useRef(false);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    clearAuthStorage();
  }, []);

  const persistSession = useCallback((data: AuthResponse): User => {
    if (!data?.token || !data?.user) {
      throw new Error('Invalid auth response');
    }

    safeStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    if (data.refreshToken) {
      safeStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
    }

    setCurrentUser(data.user);
    return data.user;
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    // Return existing inflight promise if available
    if ((window as any)._inflightRefreshPromise) {
      return (window as any)._inflightRefreshPromise;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const refreshTask = async () => {
      try {
        const data = await apiRequest<AuthResponse>('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        persistSession(data);
        return true;
      } catch (error) {
        const isRetryable = error instanceof ApiRequestError && error.retryable;
        if (!isRetryable) {
          clearSession();
        }
        return false;
      } finally {
        (window as any)._inflightRefreshPromise = null;
      }
    };

    (window as any)._inflightRefreshPromise = refreshTask();
    return (window as any)._inflightRefreshPromise;
  }, [clearSession, persistSession]);

  useEffect(() => {
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();

    if (!token) {
      if (!currentUser) {
        clearSession();
      }
      return;
    }

    if (isTokenExpired(token)) {
      if (!refreshToken) {
        clearSession();
        return;
      }

      void refreshSession();
    }
  }, [clearSession, currentUser, refreshSession]);

  useEffect(() => {
    try {
      if (currentUser) {
        safeStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        safeStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error writing current user to safeStorage', error);
    }
  }, [currentUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      recaptchaToken?: string,
      captchaFallback?: {
        type: 'math-v1';
        left: number;
        right: number;
        operator: '+' | '-';
        answer: number;
      }
    ): Promise<User> => {
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      if (!password || password.length < 1) {
        throw new Error('Password is required');
      }

      try {
        const data = await apiRequest<AuthResponse>('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: sanitizedEmail,
            password,
            recaptchaToken,
            captchaFallback,
          }),
        });

        return persistSession(data);
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to login');
        console.error('Login error:', message);
        throw new Error(message);
      }
    },
    [persistSession]
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await apiRequest('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        // Ignore timeout or network errors during logout
      }
    }
    clearSession();
  }, [clearSession]);

  const protectedApiRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = getStoredToken();
      if (!token) {
        clearSession();
        throw new Error('Session expired. Please sign in again.');
      }

      let accessToken = token;

      if (isTokenExpired(accessToken)) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          throw new Error('Session expired. Please sign in again.');
        }
        const updatedToken = getStoredToken();
        if (!updatedToken) {
          throw new Error('Session expired. Please sign in again.');
        }
        accessToken = updatedToken;
      }

      const mergedHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      };

      try {
        return await apiRequest<T>(path, {
          ...options,
          headers: mergedHeaders,
        });
      } catch (error) {
        if (error instanceof ApiRequestError && error.statusCode === 401) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            throw new Error('Session expired. Please sign in again.');
          }

          const retriedToken = getStoredToken();
          if (!retriedToken) {
            throw new Error('Session expired. Please sign in again.');
          }

          return await apiRequest<T>(path, {
            ...options,
            headers: {
              ...(options.headers || {}),
              Authorization: `Bearer ${retriedToken}`,
            },
          });
        }

        throw error;
      }
    },
    [clearSession, refreshSession]
  );

  const fetchProfile = useCallback(async (): Promise<User> => {
    try {
      const profile = await protectedApiRequest<User>('/auth/me', {
        method: 'GET',
      });

      if (isAdminEmail(profile.email)) {
        profile.role = 'admin';
      }

      setCurrentUser(profile);
      return profile;
    } catch (err) {
      console.error('fetchProfile error: ', err);
      const isApiError = err instanceof ApiRequestError;
      const retryable = isApiError ? err.retryable : true;

      if (isApiError && err.statusCode === 404) {
        clearSession();
        toast.error('Session expired or user not found. Please sign in again.');
        throw err;
      }

      // Surface non-retryable API errors to the user instead of failing silently in background
      if (isApiError && !retryable) {
        toast.error(getErrorMessage(err, 'Failed to sync profile data.'));
      }
      throw err;
    }
  }, [protectedApiRequest, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      const isAuth = !!currentUser && !!token && (!isTokenExpired(token) || !!refreshToken);
      
      if (isVisible && isAuth && !wishlistMutationRef.current) {
        void fetchProfile().catch(() => undefined);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [fetchProfile, currentUser]);

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      recaptchaToken?: string,
      captchaFallback?: {
        type: 'math-v1';
        left: number;
        right: number;
        operator: '+' | '-';
        answer: number;
      }
    ): Promise<User> => {
      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      if (!validateName(sanitizedName)) throw new Error('Name must be 2-100 characters');
      if (!validateEmail(sanitizedEmail)) throw new Error('Invalid email format');
      if (!validatePassword(password)) throw new Error('Password must be 6-128 characters');

      try {
        const data = await apiRequest<AuthResponse>('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sanitizedName,
            email: sanitizedEmail,
            password,
            recaptchaToken,
            captchaFallback,
          }),
        });
        return persistSession(data);
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to signup');
        console.error('Signup error:', message);
        throw new Error(message);
      }
    },
    [persistSession]
  );

  const socialLogin = useCallback(
    async (socialUser: {
      firstName: string;
      lastName: string;
      email: string;
      photoUrl?: string;
      firebaseToken?: string;
      providerUserId?: string;
    }): Promise<User> => {
      const name = `${socialUser.firstName} ${socialUser.lastName}`.trim();
      const normalizedEmail = sanitizeInput(socialUser.email.trim().toLowerCase());

      if (!validateEmail(normalizedEmail)) {
        throw new Error('Google account did not provide a valid email address.');
      }

      const minimalPayload = {
        name,
        email: normalizedEmail,
      };

      const fullPayload = {
        ...minimalPayload,
        photoUrl: socialUser.photoUrl,
        firebaseToken: socialUser.firebaseToken,
        providerUserId: socialUser.providerUserId,
      };

      try {
        let data: AuthResponse;

        try {
          data = await apiRequest<AuthResponse>('/auth/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload),
          });
        } catch (error) {
          const shouldRetryMinimal =
            error instanceof ApiRequestError &&
            typeof error.statusCode === 'number' &&
            error.statusCode >= 500;

          if (!shouldRetryMinimal) {
            throw error;
          }

          data = await apiRequest<AuthResponse>('/auth/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalPayload),
          });
        }

        if (isAdminEmail(data.user.email)) {
          data.user = {
            ...data.user,
            role: 'admin',
          };
        }
        return persistSession(data);
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Google sign-in failed. Please try again.');
        throw new Error(message);
      }
    },
    [persistSession]
  );

  const updateProfile = useCallback(
    async (updatedData: {
      name?: string;
      profilePictureUrl?: string;
      phone?: string;
      bio?: string;
      defaultShippingAddress?: {
        fullName: string;
        address: string;
        city: string;
        phone: string;
      };
    }): Promise<User> => {
      if (!currentUser) throw new Error('No user logged in');

      try {
        const updatedUser = await protectedApiRequest<User>(`/auth/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });
        setCurrentUser(updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },
    [currentUser, protectedApiRequest]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      if (!currentPassword || !newPassword) {
        throw new Error('Current and new passwords are required');
      }

      await protectedApiRequest<{ message: string }>(`/auth/${currentUser.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
    [currentUser, protectedApiRequest]
  );

  const deleteAccount = useCallback(
    async (password?: string): Promise<void> => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      await protectedApiRequest<unknown>(`/auth/${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(password ? { password } : {}),
      });

      clearSession();
    },
    [clearSession, currentUser, protectedApiRequest]
  );

  const addToWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser || inFlightWishlist.current.has(productId)) return;

      // Optimistic update
      setCurrentUser(prev => prev && !(prev.wishlist ?? []).includes(productId) 
        ? { ...prev, wishlist: [...(prev.wishlist ?? []), productId] } 
        : prev);
        
      inFlightWishlist.current.add(productId);
      wishlistMutationRef.current = true;

      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });
      } catch (err) {
        console.error('Failed to sync wishlist', err);
        setCurrentUser(prev => prev ? { ...prev, wishlist: (prev.wishlist ?? []).filter(id => id !== productId) } : prev);
        toast.error('Failed to update wishlist. Please try again.');
      } finally {
        inFlightWishlist.current.delete(productId);
        wishlistMutationRef.current = false;
      }
    },
    [currentUser, protectedApiRequest, toast]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser || inFlightWishlist.current.has(productId)) return;

      setCurrentUser(prev => prev && (prev.wishlist ?? []).includes(productId) 
        ? { ...prev, wishlist: (prev.wishlist ?? []).filter(id => id !== productId) } 
        : prev);
        
      inFlightWishlist.current.add(productId);
      wishlistMutationRef.current = true;

      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/wishlist/${productId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to sync wishlist removal', err);
        setCurrentUser(prev => prev ? { ...prev, wishlist: [...(prev.wishlist ?? []), productId] } : prev);
        toast.error('Failed to remove from wishlist. Please try again.');
      } finally {
        inFlightWishlist.current.delete(productId);
        wishlistMutationRef.current = false;
      }
    },
    [currentUser, protectedApiRequest, toast]
  );

  const favoritePet = useCallback(
    async (animalId: number) => {
      if (!currentUser || inFlightFavorites.current.has(animalId)) return;
      if (!validateId(animalId)) return;
      if ((currentUser.favorites ?? []).includes(animalId)) return;

      // Limit favorites size to prevent abuse
      if ((currentUser.favorites ?? []).length >= 100) return;

      setCurrentUser(prev => prev ? { ...prev, favorites: [...(prev.favorites ?? []), animalId] } : prev);
      inFlightFavorites.current.add(animalId);

      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ animalId }),
        });
      } catch (err) {
        console.error('Failed to sync favorite', err);
        setCurrentUser(prev => prev ? { ...prev, favorites: (prev.favorites ?? []).filter(id => id !== animalId) } : prev);
        toast.error('Failed to favorite pet');
      } finally {
        inFlightFavorites.current.delete(animalId);
      }
    },
    [currentUser, protectedApiRequest, toast]
  );

  const unfavoritePet = useCallback(
    async (animalId: number) => {
      if (!currentUser || inFlightFavorites.current.has(animalId)) return;
      if (!validateId(animalId)) return;

      setCurrentUser(prev => prev ? { ...prev, favorites: (prev.favorites ?? []).filter(id => id !== animalId) } : prev);
      inFlightFavorites.current.add(animalId);

      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/favorites/${animalId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to sync unfavorite', err);
        setCurrentUser(prev => prev ? { ...prev, favorites: [...(prev.favorites ?? []), animalId] } : prev);
        toast.error('Failed to remove pet from favorites');
      } finally {
        inFlightFavorites.current.delete(animalId);
      }
    },
    [currentUser, protectedApiRequest, toast]
  );

  const subscribeToPlus = useCallback(async () => {
    if (!currentUser || inFlightSubscription.current) return;

    setCurrentUser(prev => prev ? { ...prev, isPlusMember: true } : prev);
    inFlightSubscription.current = true;

    try {
      await protectedApiRequest<unknown>(`/auth/${currentUser.id}/subscribe`, {
        method: 'POST',
      });
      toast.success('Successfully subscribed to PetBhai Plus!');
    } catch (err) {
      console.error('Failed to sync subscription', err);
      setCurrentUser(prev => prev ? { ...prev, isPlusMember: false } : prev);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      inFlightSubscription.current = false;
    }
  }, [currentUser, protectedApiRequest, toast]);

  const addOrderToHistory = useCallback(
    async (order: Order) => {
      if (!currentUser) return;
      if (!order || !order.orderId) return;

      setCurrentUser(prev => {
        if (!prev) return prev;
        const limitedHistory = (prev.orderHistory ?? []).slice(0, 99);
        return { ...prev, orderHistory: [order, ...limitedHistory] };
      });

      // Persist to backend
      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        });
        // Phase D: Real-time behavior - converge with backend timeline immediately
        await fetchProfile().catch(() => undefined);
      } catch (err) {
        // Order is still recorded locally even if backend sync fails.
        // This ensures the user sees their order immediately.
        console.error('Failed to sync order to backend', err);
        toast.error('Order synced locally, but failed to save to server.');
      }
    },
    [currentUser, protectedApiRequest, fetchProfile, toast]
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token) || currentUser) {
      return;
    }

    void fetchProfile().catch(() => undefined);
  }, [currentUser, fetchProfile]);

  const value = useMemo(() => {
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    const isAuthenticated = !!currentUser && !!token && (!isTokenExpired(token) || !!refreshToken);

    return {
      currentUser,
      isAuthenticated,
      login,
      logout,
      signup,
      socialLogin,
      fetchProfile,
      updateProfile,
      changePassword,
      deleteAccount,
      addToWishlist,
      removeFromWishlist,
      addOrderToHistory,
      favoritePet,
      unfavoritePet,
      subscribeToPlus,
    };
  }, [
    currentUser,
    login,
    logout,
    signup,
    socialLogin,
    fetchProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    addToWishlist,
    removeFromWishlist,
    addOrderToHistory,
    favoritePet,
    unfavoritePet,
    subscribeToPlus,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
