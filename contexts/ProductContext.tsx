import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Product, Review } from '../types';

// Use relative path for API to leverage Vite proxy in dev and same-origin in prod
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProductReview: (productId: number, review: Review) => void;
  refetch: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid products data received');
      }
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProductReview = useCallback((productId: number, review: Review) => {
    // Optimistic local update
    setProducts((prevProducts) => {
      return prevProducts.map((product) => {
        if (product.id === productId) {
          const updatedReviews = [review, ...product.reviews];
          const newAverageRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...product,
            reviews: updatedReviews,
            rating: newAverageRating,
          };
        }
        return product;
      });
    });

    // Persist to backend (fire-and-forget, optimistic)
    fetch(`${API_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    }).catch((err) => {
      console.error('Failed to sync review to backend', err);
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
