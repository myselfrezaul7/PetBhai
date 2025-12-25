import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Vet } from '../types';
import { MOCK_VETS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface VetContextType {
  vets: Vet[];
  loading: boolean;
  error: string | null;
}

const VetContext = createContext<VetContextType | undefined>(undefined);

export const VetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/vets`);
        if (!response.ok) {
          throw new Error('Failed to fetch vets');
        }
        const data = await response.json();
        setVets(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vets:', err);
        // Fallback to mock data silently
        setVets(MOCK_VETS);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVets();
  }, []);

  const value = {
    vets,
    loading,
    error,
  };

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
