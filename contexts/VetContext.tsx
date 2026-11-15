import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Vet } from '../types';
import { apiRequest, getErrorMessage } from '../services/apiClient';
import { safeStorage } from '../lib/storage';

const VETS_CACHE_KEY = 'petbhai_cached_vets';

const readCachedVets = (): Vet[] => {
  try {
    const raw = safeStorage.getItem(VETS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

interface VetContextType {
  vets: Vet[];
  loading: boolean;
  error: string | null;
  refetch: (silent?: boolean) => Promise<void>;
}

const VetContext = createContext<VetContextType | undefined>(undefined);

export const VetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vets, setVets] = useState<Vet[]>(() => readCachedVets());
  const [loading, setLoading] = useState<boolean>(() => readCachedVets().length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchVets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiRequest<Vet[]>('/vets');
      if (!Array.isArray(data)) {
        throw new Error('Invalid vet data received');
      }
      setVets(data);
      setError(null);
      try {
        safeStorage.setItem(VETS_CACHE_KEY, JSON.stringify(data));
      } catch {
        /* ignore storage quota errors */
      }
    } catch (err) {
      console.error('Error fetching vets:', err);
      const cached = readCachedVets();
      if (cached.length > 0) {
        setVets(cached);
        setError(null);
      } else if (!silent) {
        setError(getErrorMessage(err, 'Failed to load veterinarians. Please try again.'));
        setVets([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVets(readCachedVets().length > 0);
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
