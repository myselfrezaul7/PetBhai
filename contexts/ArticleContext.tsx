import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Article } from '../types';
import { normalizeArticle } from '../lib/articleUtils';
import { apiRequest, getErrorMessage, ApiRequestError } from '../services/apiClient';

interface ArticleContextType {
  articles: Article[];
  loading: boolean;
  error: string | null;
  updateArticleImage: (articleId: number, imageUrl: string) => void;
  refetch: () => void;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (silent = false, retryCount = 0) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiRequest<Article[]>('/articles');
      const validData = Array.isArray(data) ? data.filter(Boolean) : [];
      const normalizedData = validData.map(normalizeArticle);
      
      setArticles(normalizedData);
      
      // Save to cache
      try {
        sessionStorage.setItem('petbhai_articles_cache', JSON.stringify(normalizedData));
      } catch (e) {
        /* ignore storage quota errors */
      }
      
      if (!silent) setError(null);
    } catch (err) {
      console.error('Error fetching articles:', err);
      const isApiError = err instanceof ApiRequestError;
      const retryable = isApiError ? err.retryable : true;

      if (retryCount < 1 && (retryable || !isApiError)) {
        console.log(`Retrying fetch (Attempt ${retryCount + 1})...`);
        setTimeout(() => fetchArticles(silent, retryCount + 1), 2000);
        return;
      }

      // Try falling back to cache
      let cachedData = null;
      try {
        const cachedString = sessionStorage.getItem('petbhai_articles_cache');
        if (cachedString) {
          cachedData = JSON.parse(cachedString);
        }
      } catch (e) {
        /* parse error */
      }

      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('Using cached articles as fallback');
        setArticles(cachedData);
        if (!silent) setError(null); // Clear error since we have cached data
      } else if (!silent || (!retryable && isApiError)) {
        setError(getErrorMessage(err, 'Failed to load articles. Please try again.'));
        setArticles([]);
      }
    } finally {
      if (!silent && retryCount >= 1) setLoading(false);
      else if (!silent && typeof err === 'undefined') setLoading(false);
      else if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchArticles(true);
      }
    };
    const handleFocus = () => void fetchArticles(true);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => void fetchArticles(true), 5 * 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [fetchArticles]);

  const updateArticleImage = useCallback((articleId: number, imageUrl: string) => {
    setArticles((prevArticles) =>
      prevArticles.map((article) => (article.id === articleId ? { ...article, imageUrl } : article))
    );
  }, []);

  const value = useMemo(
    () => ({
      articles,
      loading,
      error,
      updateArticleImage,
      refetch: fetchArticles,
    }),
    [articles, loading, error, updateArticleImage, fetchArticles]
  );

  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
};
