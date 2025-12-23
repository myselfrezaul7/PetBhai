import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, Order } from '../types';

const CURRENT_USER_STORAGE_KEY = 'petbhai_currentUser';
const API_BASE_URL = 'http://localhost:5000/api/auth';

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

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const user = await response.json();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const user = await response.json();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const socialLogin = async (socialUser: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<User> => {
    // For social login, we'll just simulate a signup/login flow
    // In a real app, you'd send the social token to the backend
    const mockUser: User = {
      id: Date.now(),
      name: `${socialUser.firstName} ${socialUser.lastName}`,
      email: socialUser.email,
      wishlist: [],
      orderHistory: [],
      favorites: [],
      isPlusMember: false,
    };
    setCurrentUser(mockUser);
    return mockUser;
  };

  const updateProfile = async (updatedData: {
    name?: string;
    profilePictureUrl?: string;
  }): Promise<User> => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const addToWishlist = async (productId: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}/wishlist/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const favoritePet = async (animalId: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animalId }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error favoriting pet:', error);
    }
  };

  const unfavoritePet = async (animalId: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}/favorites/${animalId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error unfavoriting pet:', error);
    }
  };

  const subscribeToPlus = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${currentUser.id}/subscribe`, {
        method: 'POST',
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error subscribing to plus:', error);
    }
  };

  const addOrderToHistory = (order: Order) => {
    // This is usually handled by the backend when an order is created.
    // But if we need to update the local user state immediately:
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
