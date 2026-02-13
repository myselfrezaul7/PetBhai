import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Animal } from '../types';
import { apiRequest, getErrorMessage } from '../services/apiClient';

interface AnimalContextType {
  animals: Animal[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export const AnimalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Animal[]>('/animals');
      if (!Array.isArray(data)) {
        throw new Error('Invalid animal data received');
      }
      setAnimals(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError(
        getErrorMessage(err, 'Failed to load animals for adoption. Please try again later.')
      );
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const value = useMemo(
    () => ({
      animals,
      loading,
      error,
      refetch: fetchAnimals,
    }),
    [animals, loading, error, fetchAnimals]
  );

  return <AnimalContext.Provider value={value}>{children}</AnimalContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAnimals = () => {
  const context = useContext(AnimalContext);
  if (context === undefined) {
    throw new Error('useAnimals must be used within an AnimalProvider');
  }
  return context;
};
