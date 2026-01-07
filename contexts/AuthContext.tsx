import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User, Order } from '../types';
import { sanitizeInput, validateId } from '../lib/security';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const TOKEN_STORAGE_KEY = 'petbhai_token';
const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<User>;
  socialLogin: (socialUser: {
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
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

  const login = useCallback(async (email: string, password: string): Promise<User> => {
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
        body: JSON.stringify({ email: sanitizedEmail, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();

      // Save token
      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setCurrentUser(data.user);

      return data.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      if (!validateName(sanitizedName)) throw new Error('Name must be 2-100 characters');
      if (!validateEmail(sanitizedEmail)) throw new Error('Invalid email format');
      if (!validatePassword(password)) throw new Error('Password must be 6-128 characters');

      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sanitizedName, email: sanitizedEmail, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Signup failed');
        }

        const data: AuthResponse = await response.json();
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);

        return data.user;
      } catch (error: any) {
        console.error('Signup error:', error);
        throw new Error(error.message || 'Failed to signup');
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
    }): Promise<User> => {
      // For now, allow social login to just set the user in state for the session
      // In a real app, this should exchange the social token for a callback to backend
      console.warn('Social login backend integration pending');

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
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        // Note: Backend might require token in header
        const response = await fetch(`${API_URL}/auth/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
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
          const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
          await fetch(`${API_URL}/auth/${currentUser.id}/wishlist`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({ productId }),
          });
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
          const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
          await fetch(`${API_URL}/auth/${currentUser.id}/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          });
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
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        await fetch(`${API_URL}/auth/${currentUser.id}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ animalId }),
        });
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
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        await fetch(`${API_URL}/auth/${currentUser.id}/favorites/${animalId}`, {
          method: 'DELETE',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
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
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      await fetch(`${API_URL}/auth/${currentUser.id}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
    } catch (err) {
      console.error('Failed to sync subscription', err);
      setCurrentUser(oldUser);
    }
  }, [currentUser]);

  const addOrderToHistory = useCallback(
    (order: Order) => {
      if (!currentUser) return;
      if (!order || !order.orderId) return;

      // Limit order history size to prevent memory issues
      const limitedHistory = currentUser.orderHistory.slice(0, 99);

      const updatedUser = {
        ...currentUser,
        orderHistory: [order, ...limitedHistory],
      };
      setCurrentUser(updatedUser);
    },
    [currentUser]
  );

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
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
  };

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
