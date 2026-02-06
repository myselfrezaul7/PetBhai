import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Brand } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface BrandContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/brands`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid brand data received');
      }
      setBrands(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands. Please try again later.');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const value = useMemo(
    () => ({
      brands,
      loading,
      error,
      refetch: fetchBrands,
    }),
    [brands, loading, error, fetchBrands]
  );

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
