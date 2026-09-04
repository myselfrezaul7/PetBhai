import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleBlogImageError } from '../lib/imageUtils';
import { useArticleEngagement } from '../hooks/useArticleEngagement';

interface TrendingCardProps {
  article: Article;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ article }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const { viewCount } = useArticleEngagement(article.id);

  return (
    <Link
      to={`/blog/${article.slug || article.id}`}
      className="block relative w-[280px] sm:w-[360px] h-[180px] sm:h-[220px] flex-shrink-0 rounded-2xl overflow-hidden snap-start group"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700">
        <img
          src={article.imageUrl || '/blog-images/blog-placeholder.png'}
          alt={article.title}
          className={`w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleBlogImageError}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <span className="glass-card-ios bg-amber-500/90 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-md">
          🔥 Trending
        </span>
        <span className="glass-card-ios bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
          {article.readTime} min read
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300">
        <div className="text-xs font-bold text-amber-400 mb-1 tracking-wider uppercase drop-shadow-md">
          {article.category}
        </div>
        <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md group-hover:text-amber-300 transition-colors">
          {article.title}
        </h3>

        {/* Engagement row */}
        <div className="mt-2 flex items-center text-xs text-white/80 gap-3">
          <span className="flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {viewCount} {t('blog_readers') || 'readers'}
          </span>
          <span className="truncate">{article.author}</span>
        </div>
      </div>
    </Link>
  );
};

interface TrendingCarouselProps {
  articles: Article[];
}

const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ articles }) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter for featured/trending (just take the first 6 for now)
  const trendingArticles = articles.filter((a) => a.featured || true).slice(0, 6);

  if (trendingArticles.length === 0) return null;

  return (
    <div className="mb-12 relative">
      <div className="flex items-center justify-between mb-4 px-3 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🔥</span> {t('trending_stories') || 'Trending Stories'}
        </h2>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 px-3 md:px-0 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trendingArticles.map((article) => (
          <TrendingCard key={article.id} article={article} />
        ))}
      </div>

      {/* Fade edges for desktop */}
      <div className="hidden md:block absolute top-12 right-0 bottom-4 w-12 bg-gradient-to-l from-slate-50 dark:from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
};

export default TrendingCarousel;
