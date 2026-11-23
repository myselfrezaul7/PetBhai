import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { handleBlogImageError } from '../lib/imageUtils';
import { safeStorage } from '../lib/storage';
import { getBaselineReaders } from '../services/blogEngagement';
import { useArticleEngagement } from '../hooks/useArticleEngagement';

const getEffectiveArticleViews = (article: Article): number => {
  const key = String(article.id);
  const rawStored = safeStorage.getItem(`article_views_${key}`);
  const storedViews = rawStored ? parseInt(rawStored, 10) : 0;
  const rawDelta = safeStorage.getItem(`petbhai_viewed_delta_${key}`);
  const localDelta = rawDelta ? parseInt(rawDelta, 10) : 0;
  const articleViews =
    typeof article.views === 'number' && Number.isFinite(article.views) ? article.views : 0;
  const baseline = getBaselineReaders(article.id);

  const safeStored = Number.isFinite(storedViews) && storedViews > 0 ? storedViews : 0;
  const safeDelta = Number.isFinite(localDelta) && localDelta > 0 ? localDelta : 0;
  const safeBaseline = Number.isFinite(baseline) && baseline > 0 ? baseline : 0;

  return Math.max(safeStored, articleViews, safeBaseline + safeDelta);
};

interface TrendingCardProps {
  article: Article;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ article }) => {
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { viewCount } = useArticleEngagement(article.id);

  const imageSrc = article.imageUrl || '/blog-images/blog-placeholder.png';

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [imageSrc]);

  return (
    <Link
      to={`/blog/${article.slug || article.id}`}
      className="w-[300px] sm:w-[360px] flex-shrink-0 snap-start p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-amber-300/80 dark:hover:border-amber-500/40 flex items-center gap-3.5 transition-all duration-300 group"
    >
      {/* Left 1:1 Square Unobstructed Thumbnail (zero cropping of 1024x1024 art) */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer" />
        )}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={article.title}
          width={112}
          height={112}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            handleBlogImageError(e);
            setIsLoaded(true);
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Right Editorial Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
              <span aria-hidden="true">🔥</span>
              <span>{isBn ? 'ট্রেন্ডিং' : 'Trending'}</span>
            </span>
            {article.category && (
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                {article.category}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {article.title}
          </h3>
        </div>

        {/* Live Reader Count + Read Time */}
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300 tabular-nums min-w-0">
            <svg
              className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="truncate">
              {viewCount.toLocaleString()} {t('blog_readers') || 'readers'}
            </span>
          </span>
          <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">
            •
          </span>
          <span className="shrink-0 whitespace-nowrap">
            {article.readTime} {isBn ? 'মিনিট পড়া' : 'min read'}
          </span>
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
  const touchPauseTimeoutRef = useRef<number | null>(null);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    return () => {
      if (touchPauseTimeoutRef.current !== null) {
        window.clearTimeout(touchPauseTimeoutRef.current);
      }
    };
  }, []);

  // Sort by featured priority first, then actual reader/view count, then newest date
  const trendingArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        const featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featuredDiff !== 0) return featuredDiff;

        const viewsDiff = getEffectiveArticleViews(b) - getEffectiveArticleViews(a);
        if (viewsDiff !== 0) return viewsDiff;

        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 6);
  }, [articles]);

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
    <section
      aria-label={isBn ? 'জনপ্রিয় লেখাগুলো' : 'Trending Stories'}
      className="mb-10 md:mb-12 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => {
        if (touchPauseTimeoutRef.current !== null) {
          window.clearTimeout(touchPauseTimeoutRef.current);
        }
        setIsPaused(true);
      }}
      onTouchEnd={() => {
        if (touchPauseTimeoutRef.current !== null) {
          window.clearTimeout(touchPauseTimeoutRef.current);
        }
        touchPauseTimeoutRef.current = window.setTimeout(() => {
          setIsPaused(false);
        }, 10000);
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              🔥
            </span>
            <span>{isBn ? 'জনপ্রিয় লেখাগুলো' : 'Trending Stories'}</span>
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
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex
                    ? 'w-6 bg-amber-500 shadow-xs'
                    : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScrollPrev}
            aria-label="Previous trending article"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white dark:hover:border-amber-500 active:scale-95 transition-all duration-200 cursor-pointer"
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
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white dark:hover:border-amber-500 active:scale-95 transition-all duration-200 cursor-pointer"
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
        className="flex overflow-x-auto gap-4 py-1 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-hide scroll-smooth"
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
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? 'w-5 bg-amber-500 shadow-xs'
                : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Subtle Fade Edge for Desktop */}
      <div className="hidden md:block absolute top-12 right-0 bottom-3 w-12 bg-gradient-to-l from-kw-bg-page to-transparent pointer-events-none" />
    </section>
  );
};

export default TrendingCarousel;
