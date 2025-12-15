import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Article } from '../types';
import { MOCK_ARTICLES } from '../constants';

const ARTICLES_STORAGE_KEY = 'petbhai_articles';

const getInitialArticles = (): Article[] => {
  try {
    const storedArticles = window.localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (storedArticles) {
      const parsed = JSON.parse(storedArticles);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // This check detects if the user has the old English content in their cache.
        // If so, it will be cleared to load the new Bengali content.
        if (parsed[0].title.includes('Canine Parvovirus')) {
          localStorage.removeItem(ARTICLES_STORAGE_KEY);
          throw new Error('Old English content detected, resetting to new Bangla content.');
        }
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading articles from localStorage, resetting to default.', error);
  }
  // If nothing in storage or an error occurs, initialize with mock data and save it.
  window.localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(MOCK_ARTICLES));
  return MOCK_ARTICLES;
};

interface ArticleContextType {
  articles: Article[];
  updateArticleImage: (articleId: number, imageUrl: string) => void;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>(getInitialArticles);

  useEffect(() => {
    try {
      window.localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
    } catch (error) {
      console.error('Error saving articles to localStorage', error);
    }
  }, [articles]);

  const updateArticleImage = (articleId: number, imageUrl: string) => {
    setArticles((prevArticles) =>
      prevArticles.map((article) => (article.id === articleId ? { ...article, imageUrl } : article))
    );
  };

  const value = {
    articles,
    updateArticleImage,
  };

  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
};
