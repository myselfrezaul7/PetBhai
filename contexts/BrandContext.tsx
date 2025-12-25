import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Brand } from '../types';
import { MOCK_BRANDS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface BrandContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/brands`);
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        const data = await response.json();
        setBrands(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching brands:', err);
        // Fallback to mock data silently
        setBrands(MOCK_BRANDS);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const value = {
    brands,
    loading,
    error,
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBrands = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};
