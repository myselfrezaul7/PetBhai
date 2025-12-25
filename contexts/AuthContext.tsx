import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, Order } from '../types';
import { MOCK_USERS } from '../constants';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const USERS_STORAGE_KEY = 'petbhai_users';

// Helper to get all users (persisted + mock)
const getAllUsers = (): User[] => {
  try {
    const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    // Initialize with mock users if empty
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  } catch (error) {
    console.error('Error reading users from localStorage', error);
    return MOCK_USERS;
  }
};

const getInitialCurrentUser = (): User | null => {
  try {
    const user = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error reading current user from localStorage', error);
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

  const login = async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getAllUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (user) {
      setCurrentUser(user);
      return user;
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getAllUsers();
    if (users.some((u) => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: Date.now(), // Simple ID generation
      name,
      email,
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
  };

  const socialLogin = async (socialUser: {
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
  }): Promise<User> => {
    // Check if user already exists
    const users = getAllUsers();
    const existingUser = users.find((u) => u.email === socialUser.email);

    if (existingUser) {
      setCurrentUser(existingUser);
      return existingUser;
    }

    const newUser: User = {
      id: Date.now(),
      name: `${socialUser.firstName} ${socialUser.lastName}`,
      email: socialUser.email,
      profilePictureUrl: socialUser.photoUrl,
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };

    setCurrentUser(newUser);
    // The useEffect will handle saving to USERS_STORAGE_KEY
    return newUser;
  };

  const updateProfile = async (updatedData: {
    name?: string;
    profilePictureUrl?: string;
  }): Promise<User> => {
    if (!currentUser) throw new Error('No user logged in');

    const updatedUser = { ...currentUser, ...updatedData };
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  const addToWishlist = async (productId: number) => {
    if (!currentUser) return;
    if (currentUser.wishlist.includes(productId)) return;

    const updatedUser = {
      ...currentUser,
      wishlist: [...currentUser.wishlist, productId],
    };
    setCurrentUser(updatedUser);
  };

  const removeFromWishlist = async (productId: number) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      wishlist: currentUser.wishlist.filter((id) => id !== productId),
    };
    setCurrentUser(updatedUser);
  };

  const favoritePet = async (animalId: number) => {
    if (!currentUser) return;
    if (currentUser.favorites.includes(animalId)) return;

    const updatedUser = {
      ...currentUser,
      favorites: [...currentUser.favorites, animalId],
    };
    setCurrentUser(updatedUser);
  };

  const unfavoritePet = async (animalId: number) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      favorites: currentUser.favorites.filter((id) => id !== animalId),
    };
    setCurrentUser(updatedUser);
  };

  const subscribeToPlus = async () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      isPlusMember: true,
    };
    setCurrentUser(updatedUser);
  };

  const addOrderToHistory = (order: Order) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        orderHistory: [order, ...currentUser.orderHistory],
      };
      setCurrentUser(updatedUser);
    }
  };

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
