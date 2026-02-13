import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Product, Review } from '../types';
import { apiRequest, getErrorMessage } from '../services/apiClient';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProductReview: (productId: number, review: Review) => Promise<void>;
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
      const data = await apiRequest<Product[]>('/products');
      if (!Array.isArray(data)) {
        throw new Error('Invalid products data received');
      }
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(getErrorMessage(err, 'Failed to load products. Please try again.'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProductReview = useCallback(async (productId: number, review: Review) => {
    const token = window.localStorage.getItem('petbhai_token');
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
