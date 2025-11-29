import React, { createContext, useContext, useReducer, useMemo, useEffect, useState } from 'react';
import type { Product, CartItem } from '../types';

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'CLEAR_CART' };

const CART_STORAGE_KEY = 'petbhai_cart_items';

const getInitialState = (): CartState => {
  try {
    const storedItems = window.localStorage.getItem(CART_STORAGE_KEY);
    if (storedItems) {
      const parsed = JSON.parse(storedItems);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
    }
  } catch (error) {
    console.error("Error reading cart from localStorage", error);
    window.localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
  }
  return { items: [] };
};


function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemExists = state.items.find(item => item.id === action.payload.id);
      if (itemExists) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(item =>
            item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ).filter(item => item.quantity > 0), // Remove if quantity is 0
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    }
    case 'CLEAR_CART': {
      return { ...state, items: [] };
    }
    default:
      return state;
  }
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, getInitialState());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Error saving cart to localStorage", error);
    }
  }, [state.items]);

  const contextValue = useMemo(() => {
    const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      cartItems: state.items,
      addToCart: (product: Product) => {
          dispatch({ type: 'ADD_ITEM', payload: product });
          setIsCartOpen(true); // Auto open cart when adding item
      },
      updateQuantity: (id: number, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
      removeFromCart: (id: number) => dispatch({ type: 'REMOVE_ITEM', payload: { id } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      cartCount,
      cartTotal,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
    };
  }, [state, isCartOpen]);

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};