import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import TrendingCarousel from '../components/TrendingCarousel';
import { ArticleGridSkeleton } from '../components/Skeletons';
import { useArticles } from '../contexts/ArticleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMediaQuery } from '../hooks/useUtilities';
import SEO from '../components/SEO';
import AskPetBhai from '../components/AskPetBhai';

const CATEGORY_ICONS: Record<string, string> = {
  'Dog Care': '🐕',
  'Cat Care': '🐱',
  Health: '💉',
  Training: '🎓',
  Nutrition: '🥩',
  Safety: '🛡️',
  All: '📰',
};

// Container stagger variants for smooth cascades
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
};

// Card entrance animation
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 24,
      mass: 0.8,
    },
  },
};

const BlogPage: React.FC = () => {
  const { articles, loading, error, refetch } = useArticles();
  const { t } = useLanguage();

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || 'All';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  // Responsive state & hooks strictly defined at top level
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [mobilePaginationMode, setMobilePaginationMode] = useState<'loadMore' | 'pages'>(
    'loadMore'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const itemsPerPage = 9;
  const [mobileLoadedCount, setMobileLoadedCount] = useState<number>(
    () => currentPage * itemsPerPage
  );

  // Debounce search query and reset page on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery && currentPage !== 1) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', '1');
        setSearchParams(newParams);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, searchParams, setSearchParams]);

  // Keep mobileLoadedCount synced with current page or category changes
  useEffect(() => {
    setMobileLoadedCount(currentPage * itemsPerPage);
  }, [categoryFilter, debouncedQuery, currentPage, itemsPerPage]);

  // Get categories with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = { All: articles.length };
    articles.forEach((a) => {
      if (a.category) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    const uniqueCats = [
      'All',
      ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean) as string[])),
    ];
    return uniqueCats.map((name) => ({
      name,
      count: counts[name] || 0,
      icon: CATEGORY_ICONS[name] || '🐾',
    }));
  }, [articles]);

  // Memoize sorted & filtered articles
  const sortedArticles = useMemo(() => {
    let filtered = [...articles];
    if (categoryFilter !== 'All') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || (a.content && a.content.toLowerCase().includes(q))
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles, categoryFilter, debouncedQuery]);

  // Calculate pagination totals
  const totalPages = Math.max(1, Math.ceil(sortedArticles.length / itemsPerPage));

  // Determine active articles for display based on responsive mode
  const isMobileLoadMore = isMobile && mobilePaginationMode === 'loadMore';

  const displayedArticles = useMemo(() => {
    if (isMobileLoadMore) {
      return sortedArticles.slice(0, Math.max(itemsPerPage, mobileLoadedCount));
    }
    return sortedArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedArticles, isMobileLoadMore, mobileLoadedCount, currentPage, itemsPerPage]);

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(targetPage));
      setSearchParams(newParams);
      setMobileLoadedCount(targetPage * itemsPerPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages, searchParams, setSearchParams, itemsPerPage]
  );

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setSearchParams(cat === 'All' ? {} : { category: cat });
      setSearchQuery('');
      setDebouncedQuery('');
      setMobileLoadedCount(itemsPerPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setSearchParams, itemsPerPage]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    setSearchParams(newParams);
    setMobileLoadedCount(itemsPerPage);
  }, [searchParams, setSearchParams, itemsPerPage]);

  const handleResetAll = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchParams({});
    setMobileLoadedCount(itemsPerPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams, itemsPerPage]);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setMobileLoadedCount((prev) => {
        const next = Math.min(prev + itemsPerPage, sortedArticles.length);
        const nextPage = Math.ceil(next / itemsPerPage);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', String(nextPage));
        setSearchParams(newParams, { replace: true });
        return next;
      });
      setIsLoadingMore(false);
    }, 180);
  }, [itemsPerPage, sortedArticles.length, searchParams, setSearchParams]);

  const structuredData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://petbhai.com';
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: displayedArticles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${origin}/blog/${article.slug || article.id}`,
        name: article.title,
      })),
    };
  }, [displayedArticles]);

  // Loading state
  if (loading) {
    return (
      <main className="container mx-auto px-3 md:px-6 py-8 md:py-16">
        <ArticleGridSkeleton count={9} />
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="container mx-auto px-6 py-16 text-center text-zinc-500 dark:text-zinc-200"
        role="alert"
      >
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Blog</h2>
        <p className="text-zinc-500 dark:text-zinc-200 mb-6">{error}</p>
        <button
          onClick={() => refetch()}
          className="min-h-[48px] px-6 py-2 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isFirstPage = currentPage === 1;
  const isAllCategories = categoryFilter === 'All' && !debouncedQuery.trim();
  const isMagazineEligible = isAllCategories && (isMobileLoadMore ? true : isFirstPage);

  // Extract layout slots based on page state
  let heroArticle = null;
  let largeArticles: typeof displayedArticles = [];
  let gridArticles: typeof displayedArticles = [];

  if (isMagazineEligible && displayedArticles.length > 0) {
    heroArticle = displayedArticles[0];
    largeArticles = displayedArticles.slice(1, 3);
    gridArticles = displayedArticles.slice(3);
  } else {
    gridArticles = displayedArticles;
  }

  const hasMoreMobileArticles = displayedArticles.length < sortedArticles.length;
  const remainingMobileCount = Math.max(0, sortedArticles.length - displayedArticles.length);
  const showTrendingCarousel = isAllCategories && (isMobileLoadMore ? true : isFirstPage);

  return (
    <>
      <SEO
        title="Pet Care Blog & Articles | PetBhai"
        description="Read expert pet care tips, guides, and stories on the PetBhai blog."
        structuredData={structuredData}
        url={`${typeof window !== 'undefined' ? window.location.origin : 'https://petbhai.com'}/blog`}
      />
      <main className="container mx-auto px-3 md:px-6 py-8 md:py-16 overflow-hidden">
        {/* Trending Stories Carousel - Shown on primary root view */}
        {showTrendingCarousel && <TrendingCarousel articles={articles} />}

        {/* Search Bar with Active Ring, Animated Clear, & Count Badge */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('search') || 'Search articles...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-28 sm:pr-36 py-3 sm:py-4 rounded-full glass-card-ios bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-zinc-900 dark:text-zinc-100 transition-all shadow-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-sm sm:text-base"
            />

            {/* Right-side Count Badge & Modern Animated Clear Button */}
            <div className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3.5 flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 whitespace-nowrap shadow-xs">
                {sortedArticles.length} {sortedArticles.length === 1 ? 'article' : 'articles'}
              </span>

              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Liquid Category Pill Filters with Animated Active Indicator */}
        <div className="relative flex overflow-x-auto pb-4 mb-8 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide snap-x space-x-3 py-1">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.name;
            return (
              <motion.button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryChange(cat.name)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className={`relative snap-start shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 shadow-sm border select-none cursor-pointer ${
                  isSelected
                    ? 'text-white border-transparent shadow-amber-600/30 shadow-lg font-bold'
                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-amber-500/60 hover:bg-amber-50/50 dark:hover:bg-zinc-700'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-lg leading-none">{cat.icon}</span>
                <span className="relative z-10">{cat.name}</span>
                <span
                  className={`relative z-10 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                    isSelected
                      ? 'bg-white text-orange-700 font-bold shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-600'
                  }`}
                >
                  {cat.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Animated Articles Section / Empty State Container */}
        <AnimatePresence mode="wait">
          {sortedArticles.length > 0 ? (
            <motion.section
              key={`articles-${categoryFilter}-${debouncedQuery}-${isMobileLoadMore ? 'stream' : currentPage}`}
              aria-label="Blog articles"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6 md:space-y-8 w-full"
            >
              {/* HERO SLOT */}
              {heroArticle && (
                <motion.div variants={cardVariants} layout>
                  <ArticleCard article={heroArticle} variant="hero" />
                </motion.div>
              )}

              {/* LARGE SLOTS */}
              {largeArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {largeArticles.map((article, idx) => (
                    <motion.div key={article.id} variants={cardVariants} layout>
                      <ArticleCard article={article} variant="large" index={idx} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* DEFAULT GRID SLOTS */}
              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {gridArticles.map((article, idx) => (
                    <motion.div key={article.id} variants={cardVariants} layout>
                      <ArticleCard
                        article={article}
                        variant="default"
                        index={idx + largeArticles.length}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            /* Enhanced Empty Search / Filter State with Clean Illustration & Suggestions */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="text-center py-12 px-6 bg-white/90 dark:bg-zinc-800/85 rounded-3xl glass-card-ios max-w-xl mx-auto border border-amber-500/20 shadow-xl backdrop-blur-xl"
            >
              <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-2xl rotate-6 animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-tr from-amber-100 to-orange-100 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl flex items-center justify-center shadow-md border border-amber-300/40 dark:border-zinc-600">
                  <svg
                    className="w-10 h-10 text-amber-600 dark:text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {debouncedQuery
                  ? `No articles found for "${searchQuery}"`
                  : categoryFilter !== 'All'
                    ? `No articles found in ${categoryFilter}`
                    : 'No articles found'}
              </h3>

              <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {debouncedQuery
                  ? 'We couldn’t find any articles matching your search query. Try checking your spelling or using different keywords.'
                  : 'No articles match the current filter criteria. Explore another category or clear all filters.'}
              </p>

              {/* Helpful Suggestions */}
              <div className="bg-amber-50/70 dark:bg-zinc-900/60 rounded-2xl p-4 sm:p-5 mb-6 border border-amber-200/60 dark:border-zinc-700/50 text-left">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
                  Helpful Suggestions
                </p>
                <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Check your search terms for typos or spelling errors</li>
                  <li>Try broader keywords like dog, cat, food, vaccination, or health</li>
                  <li>Browse our top categories directly below:</li>
                </ul>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-amber-200/50 dark:border-zinc-800">
                  {['Dog Care', 'Cat Care', 'Health', 'Nutrition'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-2xs font-medium cursor-pointer"
                    >
                      {CATEGORY_ICONS[cat] || '🐾'} {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {debouncedQuery && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClearSearch}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span>Clear Search</span>
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleResetAll}
                  className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full font-semibold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors border border-zinc-200 dark:border-zinc-600 cursor-pointer"
                >
                  View All Articles
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Pagination Controls */}
        {sortedArticles.length > 0 && totalPages > 1 && (
          <div className="hidden md:flex justify-center mt-12 overflow-x-auto px-2 py-2">
            <div className="glass-card-ios px-2 sm:px-4 py-3 flex items-center space-x-1 flex-nowrap border border-amber-900/10 dark:border-amber-100/10 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 shadow-lg rounded-2xl">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`min-w-[48px] min-h-[48px] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-slate-100 text-zinc-400 border border-slate-200 dark:text-zinc-500 cursor-not-allowed dark:bg-zinc-900/95 dark:border-zinc-700'
                    : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 hover:bg-amber-500/10 border border-amber-900/10 dark:border-amber-100/10 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                {t('prev') || 'Prev'}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => {
                  const showEllipsisStart = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisStart && (
                        <span className="text-zinc-500 dark:text-zinc-300 px-1 select-none">
                          ...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-orange-600 dark:bg-amber-600 text-white shadow-md transform scale-105'
                            : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 hover:bg-amber-500/10 border border-amber-900/10 dark:border-amber-100/10 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`min-w-[48px] min-h-[48px] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-slate-100 text-zinc-400 border border-slate-200 dark:text-zinc-500 cursor-not-allowed dark:bg-zinc-900/95 dark:border-zinc-700'
                    : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 hover:bg-amber-500/10 border border-amber-900/10 dark:border-amber-100/10 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                {t('next') || 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Mobile Modern Pagination & Smooth Load More UX */}
        {sortedArticles.length > itemsPerPage && (
          <div className="md:hidden mt-8 space-y-4">
            {/* Mode toggle bar */}
            <div className="flex items-center justify-between px-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                Showing{' '}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {displayedArticles.length}
                </strong>{' '}
                of {sortedArticles.length} articles
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setMobilePaginationMode('loadMore')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    mobilePaginationMode === 'loadMore'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Load More
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePaginationMode('pages')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    mobilePaginationMode === 'pages'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  Pages
                </button>
              </div>
            </div>

            {mobilePaginationMode === 'loadMore' ? (
              <div className="pt-1">
                {hasMoreMobileArticles ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Loading articles...
                      </span>
                    ) : (
                      <>
                        <span>Load More Articles</span>
                        <span className="text-xs bg-black/15 px-2 py-0.5 rounded-full font-medium">
                          {remainingMobileCount} left
                        </span>
                        <svg
                          className="w-4 h-4 animate-bounce"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div className="text-center py-4 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                    <span>🐾 You've viewed all {sortedArticles.length} articles!</span>
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Top ↑
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Mobile Numbers Pagination Bar */
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === 1
                      ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900/60 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer'
                  }`}
                >
                  {t('prev') || 'Prev'}
                </button>

                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === totalPages
                      ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900/60 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer'
                  }`}
                >
                  {t('next') || 'Next'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Community Q&A: Ask PetBhai */}
        <AskPetBhai />
      </main>
    </>
  );
};

export default BlogPage;
