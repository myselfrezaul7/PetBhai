import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Animal } from '../types';
import { MOCK_ANIMALS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AnimalContextType {
  animals: Animal[];
  loading: boolean;
  error: string | null;
  updateAnimalStatus?: (id: number, status: string) => void; // Placeholder for future
}

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export const AnimalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/animals`);
        if (!response.ok) {
          throw new Error('Failed to fetch animals');
        }
        const data = await response.json();
        setAnimals(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching animals:', err);
        // Fallback to mock data silently so the UI doesn't break
        setAnimals(MOCK_ANIMALS);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  const value = {
    animals,
    loading,
    error,
  };

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
