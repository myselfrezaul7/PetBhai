import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Article } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/articles`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid article data received');
      }
      setArticles(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again later.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
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
