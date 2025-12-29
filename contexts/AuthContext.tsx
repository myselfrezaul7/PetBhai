import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User, Order } from '../types';
import { MOCK_USERS } from '../constants';
import { sanitizeInput, validateId } from '../lib/security';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const USERS_STORAGE_KEY = 'petbhai_users';

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

// Helper to get all users (persisted + mock)
const getAllUsers = (): User[] => {
  try {
    const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      // Validate that parsed data is an array of user-like objects
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (u) =>
            u && typeof u === 'object' && typeof u.id === 'number' && typeof u.email === 'string'
        )
      ) {
        return parsed;
      }
      // Clear invalid data
      console.warn('Invalid user data in localStorage, resetting to mock users');
      window.localStorage.removeItem(USERS_STORAGE_KEY);
    }
    // Initialize with mock users if empty or invalid
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  } catch (error) {
    console.error('Error reading users from localStorage', error);
    try {
      window.localStorage.removeItem(USERS_STORAGE_KEY);
    } catch {
      // localStorage might be disabled
    }
    return MOCK_USERS;
  }
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

  // Sync currentUser changes to localStorage and update the user in the main users list
  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));

        // Also update this user in the main users list
        const allUsers = getAllUsers();
        const updatedUsers = allUsers.map((u) => (u.id === currentUser.id ? currentUser : u));
        // If user not found (e.g. social login), add them
        if (!updatedUsers.find((u) => u.id === currentUser.id)) {
          updatedUsers.push(currentUser);
        }
        window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      } else {
        window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error writing current user to localStorage', error);
    }
  }, [currentUser]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    // Validate inputs
    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }

    if (!password || password.length < 1) {
      throw new Error('Password is required');
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getAllUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === sanitizedEmail && u.password === password
    );

    if (user) {
      // Don't expose password in session
      const safeUser = { ...user };
      setCurrentUser(safeUser);
      return safeUser;
    } else {
      throw new Error('Invalid email or password');
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      // Validate and sanitize inputs
      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

      if (!validateName(sanitizedName)) {
        throw new Error('Name must be 2-100 characters');
      }

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be 6-128 characters');
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const users = getAllUsers();
      if (users.some((u) => u.email.toLowerCase() === sanitizedEmail)) {
        throw new Error('User with this email already exists');
      }

      const newUser: User = {
        id: Date.now(), // Simple ID generation
        name: sanitizedName,
        email: sanitizedEmail,
        password,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        isPlusMember: false,
      };

      const updatedUsers = [...users, newUser];
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      setCurrentUser(newUser);
      return newUser;
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
      // Validate and sanitize social login data
      const sanitizedFirstName = sanitizeInput(socialUser.firstName?.trim() || '');
      const sanitizedLastName = sanitizeInput(socialUser.lastName?.trim() || '');
      const sanitizedEmail = sanitizeInput(socialUser.email?.trim().toLowerCase() || '');

      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email from social provider');
      }

      // Check if user already exists
      const users = getAllUsers();
      const existingUser = users.find((u) => u.email.toLowerCase() === sanitizedEmail);

      if (existingUser) {
        setCurrentUser(existingUser);
        return existingUser;
      }

      const newUser: User = {
        id: Date.now(),
        name: `${sanitizedFirstName} ${sanitizedLastName}`.trim() || 'User',
        email: sanitizedEmail,
        profilePictureUrl: socialUser.photoUrl,
        wishlist: [],
        orderHistory: [],
        favorites: [],
        isPlusMember: false,
      };

      setCurrentUser(newUser);
      // The useEffect will handle saving to USERS_STORAGE_KEY
      return newUser;
    },
    []
  );

  const updateProfile = useCallback(
    async (updatedData: { name?: string; profilePictureUrl?: string }): Promise<User> => {
      if (!currentUser) throw new Error('No user logged in');

      const sanitizedData: Partial<User> = {};

      if (updatedData.name !== undefined) {
        const sanitizedName = sanitizeInput(updatedData.name.trim());
        if (!validateName(sanitizedName)) {
          throw new Error('Name must be 2-100 characters');
        }
        sanitizedData.name = sanitizedName;
      }

      if (updatedData.profilePictureUrl !== undefined) {
        // Basic URL validation
        if (updatedData.profilePictureUrl && !updatedData.profilePictureUrl.startsWith('http')) {
          throw new Error('Invalid profile picture URL');
        }
        sanitizedData.profilePictureUrl = updatedData.profilePictureUrl;
      }

      const updatedUser = { ...currentUser, ...sanitizedData };
      setCurrentUser(updatedUser);
      return updatedUser;
    },
    [currentUser]
  );

  const addToWishlist = useCallback(
    (productId: number) => {
      if (!currentUser) return;
      if (!validateId(productId)) return;
      if (currentUser.wishlist.includes(productId)) return;

      // Limit wishlist size to prevent abuse
      if (currentUser.wishlist.length >= 100) return;

      const updatedUser = {
        ...currentUser,
        wishlist: [...currentUser.wishlist, productId],
      };
      setCurrentUser(updatedUser);
    },
    [currentUser]
  );

  const removeFromWishlist = useCallback(
    (productId: number) => {
      if (!currentUser) return;
      if (!validateId(productId)) return;

      const updatedUser = {
        ...currentUser,
        wishlist: currentUser.wishlist.filter((id) => id !== productId),
      };
      setCurrentUser(updatedUser);
    },
    [currentUser]
  );

  const favoritePet = useCallback(
    (animalId: number) => {
      if (!currentUser) return;
      if (!validateId(animalId)) return;
      if (currentUser.favorites.includes(animalId)) return;

      // Limit favorites size to prevent abuse
      if (currentUser.favorites.length >= 100) return;

      const updatedUser = {
        ...currentUser,
        favorites: [...currentUser.favorites, animalId],
      };
      setCurrentUser(updatedUser);
    },
    [currentUser]
  );

  const unfavoritePet = useCallback(
    (animalId: number) => {
      if (!currentUser) return;
      if (!validateId(animalId)) return;

      const updatedUser = {
        ...currentUser,
        favorites: currentUser.favorites.filter((id) => id !== animalId),
      };
      setCurrentUser(updatedUser);
    },
    [currentUser]
  );

  const subscribeToPlus = useCallback(() => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      isPlusMember: true,
    };
    setCurrentUser(updatedUser);
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
