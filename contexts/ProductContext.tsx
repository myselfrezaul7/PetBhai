import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Product, Review } from '../types';
import { MOCK_PRODUCTS } from '../constants';

// Use relative path for API to leverage Vite proxy in dev and same-origin in prod
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProductReview: (productId: number, review: Review) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Using offline data.');
        // Fallback to mock data if API fails
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProductReview = (productId: number, review: Review) => {
    // TODO: Implement API call to add review
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
  };

  const value = {
    products,
    loading,
    error,
    addProductReview,
  };

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
