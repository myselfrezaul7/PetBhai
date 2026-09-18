import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticleDetailPage from '../../pages/ArticleDetailPage';
import type { Article } from '../../types';

jest.mock('../../components/SEO', () => () => null);
jest.mock('../../components/BlogCommunityCTA', () => () => null);
jest.mock('../../components/ReadingProgressBar', () => () => null);

const mockArticles: Article[] = [
  {
    id: 101,
    slug: 'dog-diet-guide',
    title: 'Dog Diet Guide',
    excerpt: 'Diet tips for dogs',
    category: 'Dog Care',
    content:
      '## গরমে হিটস্ট্রোক\n\nবিবরণ ১\n\n### লক্ষণ ও সতর্কতা\n\nবিবরণ ২\n\n**অন্যান্য তথ্য**\n\nবিবরণ ৩',
    imageUrl: 'https://picsum.photos/seed/article1/800/500',
    author: 'PetBhai Team',
    date: '2025-01-10T00:00:00.000Z',
    readTime: 3,
  },
  {
    id: 102,
    slug: 'dog-exercise',
    title: 'Dog Exercise Routine',
    category: 'Dog Care',
    content: 'Exercise guide for dogs.',
    imageUrl: 'https://picsum.photos/seed/article2/800/500',
    author: 'PetBhai Team',
    date: '2025-01-15T00:00:00.000Z',
    readTime: 4,
  },
  {
    id: 103,
    slug: 'cat-nutrition',
    title: 'Cat Nutrition 101',
    category: 'Cat Care',
    content: 'Nutrition guide for cats.',
    imageUrl: 'https://picsum.photos/seed/article3/800/500',
    author: 'PetBhai Team',
    date: '2025-01-12T00:00:00.000Z',
    readTime: 5,
  },
  {
    id: 104,
    slug: 'cat-grooming',
    title: 'Cat Grooming Tips',
    category: 'Cat Care',
    content: 'Grooming guide for cats.',
    imageUrl: 'https://picsum.photos/seed/article4/800/500',
    author: 'PetBhai Team',
    date: '2025-01-08T00:00:00.000Z',
    readTime: 2,
  },
];

jest.mock('../../contexts/ArticleContext', () => ({
  useArticles: () => ({
    articles: mockArticles,
    loading: false,
    error: null,
    updateArticleImage: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    toggleLanguage: jest.fn(),
    t: (key: string) => {
      const trans: Record<string, string> = {
        related_articles: 'Related Articles',
        btn_back_blog: 'Back to Blog',
        article_written_by: 'Written by:',
        blog_min_read: 'min read',
        blog_readers: 'readers',
      };
      return trans[key] || key;
    },
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
  }),
}));

jest.mock('../../hooks/useArticleEngagement', () => ({
  useArticleEngagement: () => ({
    likeCount: 5,
    commentCount: 0,
    viewCount: 42,
    isLiked: false,
    comments: [],
    loadingComments: false,
    toggleLike: jest.fn(),
    addComment: jest.fn(),
    deleteComment: jest.fn(),
  }),
}));

describe('ArticleDetailPage', () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
  });

  it('scrolls to top on mount and renders headings in TOC with Unicode IDs', () => {
    render(
      <MemoryRouter initialEntries={['/blog/dog-diet-guide']}>
        <Routes>
          <Route path="/blog/:slug" element={<ArticleDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });

    // Table of contents headings
    const tocLinks = screen.getAllByRole('link', { name: /গরমে হিটস্ট্রোক/i });
    expect(tocLinks.length).toBeGreaterThan(0);
    expect(tocLinks[0]).toHaveAttribute('href', '#গরমে-হিটস্ট্রোক');

    const h3Links = screen.getAllByRole('link', { name: /লক্ষণ ও সতর্কতা/i });
    expect(h3Links.length).toBeGreaterThan(0);
    expect(h3Links[0]).toHaveAttribute('href', '#লক্ষণ-ও-সতর্কতা');

    const boldLinks = screen.getAllByRole('link', { name: /অন্যান্য তথ্য/i });
    expect(boldLinks.length).toBeGreaterThan(0);
    expect(boldLinks[0]).toHaveAttribute('href', '#অন্যান্য-তথ্য');
  });

  it('renders smart related articles matching same category first', () => {
    render(
      <MemoryRouter initialEntries={['/blog/dog-diet-guide']}>
        <Routes>
          <Route path="/blog/:slug" element={<ArticleDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Related articles heading
    expect(screen.getByRole('heading', { name: 'Related Articles' })).toBeInTheDocument();

    // Related article in the same category (Dog Care) should be present
    expect(screen.getByText('Dog Exercise Routine')).toBeInTheDocument();
  });
});
