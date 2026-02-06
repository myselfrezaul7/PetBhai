import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Vet } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface VetContextType {
  vets: Vet[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const VetContext = createContext<VetContextType | undefined>(undefined);

export const VetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/vets`);
      if (!response.ok) {
        throw new Error('Failed to fetch vets');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid vet data received');
      }
      setVets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vets:', err);
      setError('Failed to load veterinarians. Please try again later.');
      setVets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  const value = useMemo(
    () => ({
      vets,
      loading,
      error,
      refetch: fetchVets,
    }),
    [vets, loading, error, fetchVets]
  );

  return <VetContext.Provider value={value}>{children}</VetContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useVets = () => {
  const context = useContext(VetContext);
  if (context === undefined) {
    throw new Error('useVets must be used within a VetProvider');
  }
  return context;
};
