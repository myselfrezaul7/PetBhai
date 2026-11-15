import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Product, Review } from '../types';
import { apiRequest, getErrorMessage, ApiRequestError } from '../services/apiClient';

const PRODUCTS_CACHE_KEY = 'petbhai_products_cache';

const readCachedProducts = (): Product[] => {
  try {
    const raw =
      safeStorage.getItem(PRODUCTS_CACHE_KEY) || safeSessionStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistProductsCache = (data: Product[]) => {
  try {
    const serialized = JSON.stringify(data);
    safeStorage.setItem(PRODUCTS_CACHE_KEY, serialized);
    safeSessionStorage.setItem(PRODUCTS_CACHE_KEY, serialized);
  } catch {
    /* ignore storage quota errors */
  }
};

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProductReview: (productId: number, review: Review) => Promise<void>;
  refetch: (silent?: boolean) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts());
  const [loading, setLoading] = useState<boolean>(() => readCachedProducts().length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiRequest<Product[]>('/products');
      if (!Array.isArray(data)) {
        throw new Error('Invalid products data received');
      }
      setProducts(data);
      persistProductsCache(data);
      if (!silent) setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      const isApiError = err instanceof ApiRequestError;
      const retryable = isApiError ? (err as ApiRequestError).retryable : true;
      const cached = readCachedProducts();

      if (cached.length > 0) {
        setProducts(cached);
        if (!silent) setError(null);
      } else if (!silent || (!retryable && isApiError)) {
        setError(getErrorMessage(err, 'Failed to load products. Please try again.'));
        setProducts([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts(readCachedProducts().length > 0);
  }, [fetchProducts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchProducts(true);
      }
    };
    const handleFocus = () => void fetchProducts(true);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => void fetchProducts(true), 5 * 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [fetchProducts]);

  const addProductReview = useCallback(async (productId: number, review: Review) => {
    const token = safeStorage.getItem('petbhai_token');
    const response = await apiRequest<{ review: Review; rating: number }>(
      `/products/${productId}/reviews`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating: review.rating,
          comment: review.comment,
        }),
      }
    );

    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        if (product.id === productId) {
          const updatedReviews = [response.review, ...(product.reviews || [])];
          return {
            ...product,
            reviews: updatedReviews,
            rating: response.rating,
          };
        }
        return product;
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      addProductReview,
      refetch: fetchProducts,
    }),
    [products, loading, error, addProductReview, fetchProducts]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
