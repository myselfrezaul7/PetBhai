import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { User, Order } from '../types';
import { sanitizeInput, validateId } from '../lib/security';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const TOKEN_STORAGE_KEY = 'petbhai_token';
const API_URL = import.meta.env.VITE_API_URL || '/api';
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
  login: (email: string, password: string, recaptchaToken?: string) => Promise<User>;
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
    async (email: string, password: string, recaptchaToken?: string): Promise<User> => {
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      if (!password || password.length < 1) {
        throw new Error('Password is required');
      }

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: sanitizedEmail, password, recaptchaToken }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Login failed');
        }

        const data: AuthResponse = await response.json();

        // Save token
        if (!data?.token || !data?.user) {
          throw new Error('Invalid login response');
        }

        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);

        return data.user;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to login';
        console.error('Login error:', message);
        throw new Error(message);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const protectedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = getStoredToken();
      if (!token || isTokenExpired(token)) {
        clearSession();
        throw new Error('Session expired. Please sign in again.');
      }

      const mergedHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders,
      });

      if (response.status === 401) {
        clearSession();
        throw new Error('Session expired. Please sign in again.');
      }

      return response;
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
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sanitizedName,
            email: sanitizedEmail,
            password,
            recaptchaToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Signup failed');
        }

        const data: AuthResponse = await response.json();
        if (!data?.token || !data?.user) {
          throw new Error('Invalid signup response');
        }
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);

        return data.user;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to signup';
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
          const response = await fetch(`${API_URL}/auth/social`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${socialUser.firstName} ${socialUser.lastName}`.trim(),
              email: socialUser.email,
              photoUrl: socialUser.photoUrl,
              firebaseToken: socialUser.firebaseToken,
            }),
          });

          if (response.ok) {
            const data: AuthResponse = await response.json();
            window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            setCurrentUser(data.user);
            return data.user;
          }
          // Fall through to local-only if backend social endpoint isn't ready
          console.warn('Backend social login returned non-OK, falling back to local session');
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
        const response = await protectedFetch(`${API_URL}/auth/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },
    [currentUser]
  );

  const addToWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser) return;

      // Optimistic update
      const oldUser = { ...currentUser };
      if (!oldUser.wishlist.includes(productId)) {
        setCurrentUser({ ...oldUser, wishlist: [...oldUser.wishlist, productId] });

        try {
          const response = await protectedFetch(`${API_URL}/auth/${currentUser.id}/wishlist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId }),
          });

          if (!response.ok) {
            throw new Error('Failed to sync wishlist');
          }
        } catch (err) {
          console.error('Failed to sync wishlist', err);
          setCurrentUser(oldUser);
        }
      }
    },
    [currentUser]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (!currentUser) return;

      const oldUser = { ...currentUser };
      if (oldUser.wishlist.includes(productId)) {
        setCurrentUser({ ...oldUser, wishlist: oldUser.wishlist.filter((id) => id !== productId) });

        try {
          const response = await protectedFetch(
            `${API_URL}/auth/${currentUser.id}/wishlist/${productId}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to sync wishlist removal');
          }
        } catch (err) {
          console.error('Failed to sync wishlist removal', err);
          setCurrentUser(oldUser);
        }
      }
    },
    [currentUser]
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
        const response = await protectedFetch(`${API_URL}/auth/${currentUser.id}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ animalId }),
        });
        if (!response.ok) {
          throw new Error('Failed to sync favorite');
        }
      } catch (err) {
        console.error('Failed to sync favorite', err);
        setCurrentUser(oldUser);
      }
    },
    [currentUser]
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
        const response = await protectedFetch(
          `${API_URL}/auth/${currentUser.id}/favorites/${animalId}`,
          {
            method: 'DELETE',
          }
        );
        if (!response.ok) {
          throw new Error('Failed to sync unfavorite');
        }
      } catch (err) {
        console.error('Failed to sync unfavorite', err);
        setCurrentUser(oldUser);
      }
    },
    [currentUser]
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
      const response = await protectedFetch(`${API_URL}/auth/${currentUser.id}/subscribe`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync subscription');
      }
    } catch (err) {
      console.error('Failed to sync subscription', err);
      setCurrentUser(oldUser);
    }
  }, [currentUser]);

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
        const response = await protectedFetch(`${API_URL}/auth/${currentUser.id}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        });
        if (!response.ok) {
          throw new Error('Failed to sync order history');
        }
      } catch (err) {
        // Order is still recorded locally even if backend sync fails.
        // This ensures the user sees their order immediately.
        console.error('Failed to sync order to backend', err);
      }
    },
    [currentUser, protectedFetch]
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
