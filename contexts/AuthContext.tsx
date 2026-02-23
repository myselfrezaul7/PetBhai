import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { User, Order } from '../types';
import { sanitizeInput, validateId } from '../lib/security';
import { apiRequest, ApiRequestError, getErrorMessage } from '../services/apiClient';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const TOKEN_STORAGE_KEY = 'petbhai_token';
const TOKEN_EXPIRY_SKEW_MS = 30_000;

interface AuthResponse {
  user: User;
  token: string;
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

const clearAuthStorage = () => {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  } catch {
    // localStorage might be disabled
  }
};

const getStoredToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
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

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const expiryMs = payload.exp * 1000;
  return expiryMs <= Date.now() + TOKEN_EXPIRY_SKEW_MS;
};

const getInitialCurrentUser = (): User | null => {
  try {
    const user = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (user) {
      const parsed = JSON.parse(user);
      // Validate basic user structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.id === 'number' &&
        typeof parsed.email === 'string'
      ) {
        return parsed;
      }
      // Clear invalid data
      console.warn('Invalid current user data in localStorage, clearing');
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
    return null;
  } catch (error) {
    console.error('Error reading current user from localStorage', error);
    try {
      window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch {
      // localStorage might be disabled
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
  logout: () => void;
  signup: (name: string, email: string, password: string, recaptchaToken?: string) => Promise<User>;
  socialLogin: (socialUser: {
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
    firebaseToken?: string;
  }) => Promise<User>;
  updateProfile: (updatedData: { name?: string; profilePictureUrl?: string }) => Promise<User>;
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

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    clearAuthStorage();
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error writing current user to localStorage', error);
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

        // Save token
        if (!data?.token || !data?.user) {
          throw new Error('Invalid login response');
        }

        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);

        return data.user;
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to login');
        console.error('Login error:', message);
        throw new Error(message);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const protectedApiRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = getStoredToken();
      if (!token || isTokenExpired(token)) {
        clearSession();
        throw new Error('Session expired. Please sign in again.');
      }

      const mergedHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      try {
        return await apiRequest<T>(path, {
          ...options,
          headers: mergedHeaders,
        });
      } catch (error) {
        if (error instanceof ApiRequestError && error.statusCode === 401) {
          clearSession();
          throw new Error('Session expired. Please sign in again.');
        }

        throw error;
      }
    },
    [clearSession]
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      recaptchaToken?: string
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
          }),
        });
        if (!data?.token || !data?.user) {
          throw new Error('Invalid signup response');
        }
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);

        return data.user;
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Failed to signup');
        console.error('Signup error:', message);
        throw new Error(message);
      }
    },
    []
  );

  const socialLogin = useCallback(
    async (socialUser: {
      firstName: string;
      lastName: string;
      email: string;
      photoUrl?: string;
      firebaseToken?: string;
    }): Promise<User> => {
      // If a Firebase token is available, exchange it with the backend for a PetBhai JWT
      if (socialUser.firebaseToken) {
        try {
          const data = await apiRequest<AuthResponse>('/auth/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${socialUser.firstName} ${socialUser.lastName}`.trim(),
              email: socialUser.email,
              photoUrl: socialUser.photoUrl,
              firebaseToken: socialUser.firebaseToken,
            }),
          });

          if (!data?.token || !data?.user) {
            throw new Error('Invalid social login response');
          }

          window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          setCurrentUser(data.user);
          return data.user;
        } catch (err) {
          console.warn('Backend social login failed, falling back to local session', err);
        }
      }

      // Fallback: create a local-only session (no backend persistence)
      const newUser: User = {
        id: Date.now(),
        name: `${socialUser.firstName} ${socialUser.lastName}`.trim(),
        email: socialUser.email,
        profilePictureUrl: socialUser.photoUrl,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        isPlusMember: false,
      };

      setCurrentUser(newUser);
      return newUser;
    },
    []
  );

  const updateProfile = useCallback(
    async (updatedData: { name?: string; profilePictureUrl?: string }): Promise<User> => {
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

  const addToWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser) return;

      // Optimistic update
      const oldUser = { ...currentUser };
      if (!oldUser.wishlist.includes(productId)) {
        setCurrentUser({ ...oldUser, wishlist: [...oldUser.wishlist, productId] });

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
          setCurrentUser(oldUser);
        }
      }
    },
    [currentUser, protectedApiRequest]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser) return;

      const oldUser = { ...currentUser };
      if (oldUser.wishlist.includes(productId)) {
        setCurrentUser({ ...oldUser, wishlist: oldUser.wishlist.filter((id) => id !== productId) });

        try {
          await protectedApiRequest<unknown>(`/auth/${currentUser.id}/wishlist/${productId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Failed to sync wishlist removal', err);
          setCurrentUser(oldUser);
        }
      }
    },
    [currentUser, protectedApiRequest]
  );

  const favoritePet = useCallback(
    async (animalId: number) => {
      if (!currentUser) return;
      if (!validateId(animalId)) return;
      if (currentUser.favorites.includes(animalId)) return;

      // Limit favorites size to prevent abuse
      if (currentUser.favorites.length >= 100) return;

      const oldUser = { ...currentUser };
      const updatedUser = {
        ...currentUser,
        favorites: [...currentUser.favorites, animalId],
      };
      setCurrentUser(updatedUser);

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
        setCurrentUser(oldUser);
      }
    },
    [currentUser, protectedApiRequest]
  );

  const unfavoritePet = useCallback(
    async (animalId: number) => {
      if (!currentUser) return;
      if (!validateId(animalId)) return;

      const oldUser = { ...currentUser };
      const updatedUser = {
        ...currentUser,
        favorites: currentUser.favorites.filter((id) => id !== animalId),
      };
      setCurrentUser(updatedUser);

      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/favorites/${animalId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to sync unfavorite', err);
        setCurrentUser(oldUser);
      }
    },
    [currentUser, protectedApiRequest]
  );

  const subscribeToPlus = useCallback(async () => {
    if (!currentUser) return;

    const oldUser = { ...currentUser };
    const updatedUser = {
      ...currentUser,
      isPlusMember: true,
    };
    setCurrentUser(updatedUser);

    try {
      await protectedApiRequest<unknown>(`/auth/${currentUser.id}/subscribe`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to sync subscription', err);
      setCurrentUser(oldUser);
    }
  }, [currentUser, protectedApiRequest]);

  const addOrderToHistory = useCallback(
    async (order: Order) => {
      if (!currentUser) return;
      if (!order || !order.orderId) return;

      // Limit order history size to prevent memory issues
      const limitedHistory = currentUser.orderHistory.slice(0, 99);

      const updatedUser = {
        ...currentUser,
        orderHistory: [order, ...limitedHistory],
      };
      setCurrentUser(updatedUser);

      // Persist to backend
      try {
        await protectedApiRequest<unknown>(`/auth/${currentUser.id}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        });
      } catch (err) {
        // Order is still recorded locally even if backend sync fails.
        // This ensures the user sees their order immediately.
        console.error('Failed to sync order to backend', err);
      }
    },
    [currentUser, protectedApiRequest]
  );

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser && !!getStoredToken(),
      login,
      logout,
      signup,
      socialLogin,
      updateProfile,
      addToWishlist,
      removeFromWishlist,
      addOrderToHistory,
      favoritePet,
      unfavoritePet,
      subscribeToPlus,
    }),
    [
      currentUser,
      login,
      logout,
      signup,
      socialLogin,
      updateProfile,
      addToWishlist,
      removeFromWishlist,
      addOrderToHistory,
      favoritePet,
      unfavoritePet,
      subscribeToPlus,
    ]
  );

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
