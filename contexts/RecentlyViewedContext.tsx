import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Product } from '../types';
import {
  COOKIE_CONSENT_KEY,
  clearOptionalActivityStorage,
  hasOptionalCookieConsent,
  readCookieConsent,
} from '../lib/cookieConsent';

interface RecentlyViewedContextType {
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'petbhai_recently_viewed';
const MAX_ITEMS = 10;

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Load from safeStorage only when optional consent is granted.
  useEffect(() => {
    if (!hasOptionalCookieConsent(readCookieConsent())) {
      setRecentlyViewed([]);
      return;
    }

    try {
      const stored = safeStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyViewed(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed products:', error);
      safeStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save to safeStorage only when optional consent is granted.
  useEffect(() => {
    if (!hasOptionalCookieConsent(readCookieConsent())) {
      clearOptionalActivityStorage();
      return;
    }

    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error saving recently viewed products:', error);
    }
  }, [recentlyViewed]);

  // React to consent updates from other tabs and remove optional data if rejected.
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY) {
        return;
      }

      if (!hasOptionalCookieConsent(readCookieConsent())) {
        setRecentlyViewed([]);
        clearOptionalActivityStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToRecentlyViewed = useCallback((product: Product) => {
    if (!hasOptionalCookieConsent(readCookieConsent())) {
      return;
    }

    setRecentlyViewed((prev) => {
      // Remove the product if it already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to the beginning
      const updated = [product, ...filtered];
      // Limit to MAX_ITEMS
      return updated.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    safeStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      recentlyViewed,
      addToRecentlyViewed,
      clearRecentlyViewed,
    }),
    [recentlyViewed, addToRecentlyViewed, clearRecentlyViewed]
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
};

export const useRecentlyViewed = (): RecentlyViewedContextType => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};

export default RecentlyViewedContext;
