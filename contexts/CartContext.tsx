import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { Product, CartItem } from '../types';

type CartState = {
  items: CartItem[];
  lastActionTimestamp?: number;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'CLEAR_CART' };

const CART_STORAGE_KEY = 'petbhai_cart_items';

const clampQuantity = (quantity: number): number => {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(99, Math.max(1, Math.floor(quantity)));
};

const getInitialState = (): CartState => {
  try {
    const storedItems = window.localStorage.getItem(CART_STORAGE_KEY);
    if (storedItems) {
      const parsed = JSON.parse(storedItems);
      if (Array.isArray(parsed)) {
        const sanitizedItems = parsed
          .filter(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              typeof item.id === 'number' &&
              typeof item.price === 'number' &&
              Number.isFinite(item.price) &&
              item.price >= 0 &&
              typeof item.quantity === 'number'
          )
          .map((item) => ({
            ...item,
            quantity: clampQuantity(item.quantity),
          }));

        if (sanitizedItems.length > 0 || parsed.length === 0) {
          return { items: sanitizedItems };
        }
      }
      // Clear invalid data structure
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error reading cart from localStorage', error);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted data
    } catch (e) {
      // localStorage might be disabled
    }
  }
  return { items: [] };
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemExists = state.items.find((item) => item.id === action.payload.id);
      if (itemExists) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: clampQuantity(item.quantity + 1) }
              : item
          ),
          lastActionTimestamp: Date.now(),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
        lastActionTimestamp: Date.now(),
      };
    }
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: clampQuantity(action.payload.quantity) }
              : item
          )
          .filter((item) => item.quantity > 0), // Remove if quantity is 0
        lastActionTimestamp: Date.now(),
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
        lastActionTimestamp: Date.now(),
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
  lastActionTimestamp?: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, getInitialState());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const serialized = JSON.stringify(state.items);
      window.localStorage.setItem(CART_STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Error saving cart to localStorage', error);
      // localStorage might be full or disabled - don't crash the app
    }
  }, [state.items]);

  const addToCart = useCallback((product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    setIsCartOpen(true);
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const cartCount = useMemo(() => state.items.reduce((sum, item) => sum + item.quantity, 0), [
    state.items,
  ]);

  const cartTotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const contextValue = useMemo(() => {
    return {
      cartItems: state.items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal,
      isCartOpen,
      openCart,
      closeCart,
      lastActionTimestamp: state.lastActionTimestamp,
    };
  }, [
    state.items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
    state.lastActionTimestamp,
  ]);

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
