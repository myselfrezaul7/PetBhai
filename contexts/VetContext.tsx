import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Vet } from '../types';
import { apiRequest, getErrorMessage } from '../services/apiClient';

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
      const data = await apiRequest<Vet[]>('/vets');
      if (!Array.isArray(data)) {
        throw new Error('Invalid vet data received');
      }
      setVets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vets:', err);
      setError(getErrorMessage(err, 'Failed to load veterinarians. Please try again.'));
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
