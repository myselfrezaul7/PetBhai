import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { handleBlogImageError } from '../lib/imageUtils';
import { useArticleEngagement } from '../hooks/useArticleEngagement';

interface TrendingCardProps {
  article: Article;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ article }) => {
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const [isLoaded, setIsLoaded] = useState(false);
  const { viewCount } = useArticleEngagement(article.id);

  return (
    <Link
      to={`/blog/${article.slug || article.id}`}
      className="block relative w-[280px] sm:w-[360px] h-[180px] sm:h-[220px] flex-shrink-0 rounded-2xl overflow-hidden snap-start group shadow-md hover:shadow-xl transition-all duration-300 border border-white/10"
    >
      {/* Background Image with shimmer skeleton */}
      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 overflow-hidden">
        {!isLoaded && (
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer" />
        )}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
        <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-500/80 backdrop-blur-md">
          🔥 {isBn ? 'ট্রেন্ডিং' : 'Trending'}
        </span>
        <span className="bg-black/60 text-white/90 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border border-white/20">
          {article.readTime} {isBn ? 'মিনিট পড়া' : 'min read'}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 z-10">
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
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  // Filter for featured/trending (just take the first 6 for now)
  const trendingArticles = articles.filter((a) => a.featured || true).slice(0, 6);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const firstCard = container.children[0] as HTMLElement | undefined;
    const targetCard = container.children[index] as HTMLElement | undefined;
    if (firstCard && targetCard) {
      const scrollPos = targetCard.offsetLeft - firstCard.offsetLeft;
      container.scrollTo({ left: scrollPos, behavior: 'smooth' });
    } else {
      const cardWidth = firstCard?.offsetWidth || 300;
      container.scrollTo({ left: index * (cardWidth + 16), behavior: 'smooth' });
    }
    setActiveIndex(index);
  };

  const handleScrollPrev = () => {
    const nextIndex = activeIndex > 0 ? activeIndex - 1 : trendingArticles.length - 1;
    scrollToIndex(nextIndex);
  };

  const handleScrollNext = () => {
    const nextIndex = (activeIndex + 1) % trendingArticles.length;
    scrollToIndex(nextIndex);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 0 && scrollLeft >= maxScroll - 20) {
      setActiveIndex(trendingArticles.length - 1);
      return;
    }
    const firstCard = container.children[0] as HTMLElement | undefined;
    const cardWidth = firstCard?.offsetWidth || 300;
    const index = Math.round(scrollLeft / (cardWidth + 16));
    setActiveIndex(Math.min(Math.max(0, index), trendingArticles.length - 1));
  };

  // Auto-play scroll every 4.5 seconds with pause/resume support
  useEffect(() => {
    if (isPaused || trendingArticles.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % trendingArticles.length;
      scrollToIndex(nextIndex);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, trendingArticles.length]);

  if (trendingArticles.length === 0) return null;

  return (
    <div
      className="mb-12 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-4 px-3 md:px-0">
        <div className="flex items-center gap-3 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🔥</span> {isBn ? 'জনপ্রিয় লেখাগুলো' : 'Trending Stories'}
          </h2>

          {/* Desktop/Tablet Pagination Indicator Dots */}
          <div
            className="hidden sm:flex items-center gap-1.5 ml-2"
            aria-label="Trending carousel pagination"
          >
            {trendingArticles.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to trending slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-6 bg-amber-500 shadow-xs'
                    : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Frosted Glass Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScrollPrev}
            aria-label="Previous trending article"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white dark:hover:border-amber-500 active:scale-95 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleScrollNext}
            aria-label="Next trending article"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white dark:hover:border-amber-500 active:scale-95 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 pb-4 px-3 md:px-0 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {trendingArticles.map((article) => (
          <TrendingCard key={article.id} article={article} />
        ))}
      </div>

      {/* Mobile Pagination Indicator Dots */}
      <div
        className="flex sm:hidden justify-center items-center gap-1.5 pt-2"
        aria-label="Trending carousel pagination"
      >
        {trendingArticles.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Go to trending slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-5 bg-amber-500 shadow-xs'
                : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Fade edges for desktop */}
      <div className="hidden md:block absolute top-12 right-0 bottom-4 w-12 bg-gradient-to-l from-slate-50 dark:from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
};

export default TrendingCarousel;
