import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Product, Review } from '../types';
import { MOCK_PRODUCTS } from '../constants';

const PRODUCTS_STORAGE_KEY = 'petbhai_products';

const getInitialProducts = (): Product[] => {
  try {
    const storedProducts = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (storedProducts) {
      const parsed = JSON.parse(storedProducts);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading products from localStorage', error);
  }
  // If nothing in storage or error, initialize with mock data and save it.
  window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(MOCK_PRODUCTS));
  return MOCK_PRODUCTS;
};

interface ProductContextType {
  products: Product[];
  addProductReview: (productId: number, review: Review) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(getInitialProducts);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products to localStorage', error);
    }
  }, [products]);

  const addProductReview = (productId: number, review: Review) => {
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
    addProductReview,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
