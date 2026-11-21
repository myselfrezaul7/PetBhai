import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useBrands } from '../contexts/BrandContext';
import { SearchIcon } from '../components/icons';
import type { Product, ReorderSuggestion } from '../types';
import { useProducts } from '../contexts/ProductContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductQuickViewModal from '../components/ProductQuickViewModal';
import { sanitizeInput } from '../lib/security';
import { useAuth } from '../contexts/AuthContext';
import { fetchReorderSuggestions } from '../services/ecommerceService';
import ApiStateCard from '../components/ApiStateCard';
import SEO from '../components/SEO';
import { SwipeDiscovery } from '../components/SwipeDiscovery';
import { SparklesIcon } from '../components/icons';

type CategoryFilter =
  | 'All'
  | 'Dog Food'
  | 'Cat Food'
  | 'Dog Supplies'
  | 'Cat Supplies'
  | 'Grooming'
  | 'Accessories';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc' | 'top-sold';

// Category options for DRY principle
const CATEGORY_OPTIONS: CategoryFilter[] = [
  'All',
  'Dog Food',
  'Cat Food',
  'Dog Supplies',
  'Cat Supplies',
  'Grooming',
  'Accessories',
];

const PRICE_MIN = 10;
const PRICE_MAX = 20000;
const QUICK_SEARCH_TERMS = ['Royal Canin', 'Cat Food', 'Dog Food', 'Cat Litter'];

const ShopPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [activeBrand, setActiveBrand] = useState<string>(location.state?.brand || 'All');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);
  const [activeWeight, setActiveWeight] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Discovery Mode State
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);

  const { products: allProducts, loading, error, refetch } = useProducts();
  const { brands } = useBrands();
  const { isAuthenticated } = useAuth();
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [reorderLoading, setReorderLoading] = useState(false);

  // Extract unique weight values from products
  const weightOptions = useMemo(() => {
    const weights = new Set(allProducts.map((p) => p.weight).filter(Boolean));
    return Array.from(weights).sort((a, b) => {
      // Try to parse numeric part for sorting
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [allProducts]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== 'All') count++;
    if (activeBrand !== 'All') count++;
    if (activeWeight !== 'All') count++;
    if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    if (sortOption !== 'default') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [
    activeCategory,
    activeBrand,
    activeWeight,
    priceRange,
    minRating,
    inStockOnly,
    sortOption,
    searchQuery,
  ]);

  // Reset brand filter when coming from external navigation
  useEffect(() => {
    if (location.state?.brand) {
      setActiveBrand(location.state.brand);
    }
  }, [location.state?.brand]);

  // Sync search query from URL parameter (e.g., /shop?search=cat)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setReorderSuggestions([]);
      return;
    }

    let mounted = true;
    setReorderLoading(true);

    fetchReorderSuggestions()
      .then((data) => {
        if (mounted) {
          setReorderSuggestions(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch reorder suggestions', error);
        if (mounted) {
          setReorderSuggestions([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setReorderLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Memoized handlers using useCallback
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize search input to prevent XSS
    const sanitized = sanitizeInput(e.target.value);
    setSearchQuery(sanitized);
  }, []);

  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setActiveCategory(category);
  }, []);

  const handleBrandChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveBrand(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as SortOption);
  }, []);

  const handleQuickView = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveCategory('All');
    setActiveBrand('All');
    setActiveWeight('All');
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setMinRating(0);
    setInStockOnly(false);
    setSortOption('default');
  }, []);

  useEffect(() => {
    if (!isFilterSheetOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleBackButton = (e: Event) => {
      if (e.defaultPrevented || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setIsFilterSheetOpen(false);
    };
    window.addEventListener('petbhai-back-button', handleBackButton);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('petbhai-back-button', handleBackButton);
    };
  }, [isFilterSheetOpen]);

  const sortedAndFilteredProducts = useMemo(() => {
    if (loading) return [];
    let products: Product[] = [...allProducts];

    // 1. Filter by search query
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      products = products.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(lowerCaseQuery);
        const categoryMatch = p.category.toLowerCase().includes(lowerCaseQuery);
        const tagMatch = p.searchTags?.some((tag) => tag.toLowerCase().includes(lowerCaseQuery));
        return nameMatch || categoryMatch || tagMatch;
      });
    }

    // 2. Filter by category
    if (activeCategory !== 'All') {
      products = products.filter((p) => p.category === activeCategory);
    }

    // 3. Filter by brand
    if (activeBrand !== 'All') {
      const brand = brands.find((b) => b.name === activeBrand);
      if (brand) {
        products = products.filter((p) => p.brandId === brand.id);
      }
    }

    // 4. Filter by price range
    if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) {
      products = products.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }

    // 5. Filter by weight/size
    if (activeWeight !== 'All') {
      products = products.filter((p) => p.weight === activeWeight);
    }

    // 6. Filter by minimum rating
    if (minRating > 0) {
      products = products.filter((p) => p.rating >= minRating);
    }

    // 6b. Filter by in-stock status
    if (inStockOnly) {
      products = products.filter((p) => p.stockStatus !== 'out-of-stock');
    }

    // 7. Sort - use stable sort for consistent results
    switch (sortOption) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'top-sold':
        // Sort by review count (proxy for sales) then by rating
        products.sort((a, b) => {
          const soldDiff = (b.reviews?.length || 0) - (a.reviews?.length || 0);
          return soldDiff !== 0 ? soldDiff : b.rating - a.rating;
        });
        break;
      default:
        break;
    }

    return products;
  }, [
    activeCategory,
    activeBrand,
    sortOption,
    searchQuery,
    allProducts,
    brands,
    loading,
    priceRange,
    activeWeight,
    minRating,
    inStockOnly,
  ]);

  // Memoized category button component
  const CategoryFilterButton: React.FC<{ filter: CategoryFilter }> = useCallback(
    ({ filter }) => {
      const label =
        {
          All: t('cat_all'),
          'Dog Food': t('cat_dog_food'),
          'Cat Food': t('cat_cat_food'),
          'Dog Supplies': t('cat_dog_supplies'),
          'Cat Supplies': t('cat_cat_supplies'),
          Grooming: t('cat_grooming'),
          Accessories: 'Accessories',
        }[filter] || filter;

      return (
        <button
          onClick={() => handleCategoryChange(filter)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
            activeCategory === filter
              ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-lg transform scale-105'
              : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-500 dark:text-zinc-300 hover:bg-amber-500/10 dark:hover:bg-slate-600/50'
          }`}
          aria-pressed={activeCategory === filter}
          data-pressed={activeCategory === filter}
          aria-label={`Filter by ${label}`}
        >
          {label}
        </button>
      );
    },
    [activeCategory, handleCategoryChange, t]
  );

  // Calculate result count for accessibility
  const resultCount = sortedAndFilteredProducts.length;

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: sortedAndFilteredProducts.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}/#/product/${product.id}`,
        name: product.name,
      })),
    }),
    [sortedAndFilteredProducts]
  );

  return (
    <>
      <SEO
        title={`Shop ${activeCategory !== 'All' ? activeCategory : 'Pet Supplies'} | PetBhai`}
        description={`Browse ${resultCount} premium pet products including food, accessories, and supplies in our ${activeCategory !== 'All' ? activeCategory : 'comprehensive'} catalog.`}
        structuredData={structuredData}
        url={`${window.location.origin}/#/shop`}
      />
      <main className="container mx-auto px-3 md:px-6 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:py-16">
        <header className="text-center mb-6 md:mb-10 glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 md:p-8">
          <span className="inline-flex items-center rounded-full bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-800/80 border border-amber-900/10 dark:border-amber-100/10 px-3 py-1 text-xs md:text-sm font-semibold text-amber-600 dark:text-amber-500 mb-3">
            PetBhai Shop
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 md:mb-4">
            {t('shop_title')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-300 max-w-3xl mx-auto px-2">
            {t('shop_subtitle')}
          </p>
        </header>

        {isAuthenticated && (reorderLoading || reorderSuggestions.length > 0) && (
          <section
            className="glass-card-ios p-4 sm:p-6 mb-8 md:mb-12 border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-xl"
            aria-label="Smart reorder suggestions"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Smart Reorder
              </h2>
              <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">
                Based on your order cycle
              </span>
            </div>

            {reorderLoading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-300">
                Loading your reorder picks...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
                  {reorderSuggestions.map((suggestion) => (
                    <ProductCard
                      key={`reorder-${suggestion.product.id}`}
                      product={suggestion.product}
                      onQuickView={handleQuickView}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-300">
                  Recommended quantities are pre-calculated from your recent purchases.
                </p>
              </>
            )}
          </section>
        )}

        {/* Filters & Sorting */}
        <div className="sticky top-[calc(4.5rem+var(--safe-top))] z-30 glass-card-ios mb-6 space-y-3 border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-xl backdrop-blur-xl md:top-20 md:mb-12 md:space-y-6 md:p-6">
          {/* Search Bar + Mobile Filter & Discovery Actions */}
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                <SearchIcon
                  className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 dark:text-zinc-300"
                  aria-hidden="true"
                />
              </span>
              <input
                type="search"
                placeholder={t('shop_search_placeholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
                inputMode="search"
                enterKeyHint="search"
                className="w-full py-2.5 sm:py-3 pl-9 sm:pl-12 pr-4 text-base text-zinc-700 dark:text-zinc-200 bg-white/95 dark:bg-zinc-800/80 border border-slate-300/50 dark:border-amber-100/10 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm focus:shadow-md touch-manipulation"
                aria-label={t('shop_search_label')}
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="md:hidden relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slate-900 dark:bg-amber-500 px-3.5 py-2.5 text-xs font-bold text-white dark:text-zinc-950 shadow-md transition-transform active:scale-95 shrink-0"
              aria-label="Filter and sort products"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 dark:bg-zinc-950 text-[10px] font-bold leading-none text-white dark:text-amber-400">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDiscoveryMode((prev) => !prev)}
              className="flex min-h-[44px] items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95 shrink-0"
              aria-label="Toggle Discovery Mode"
            >
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Try Discovery Mode</span>
              <span className="sm:hidden">Discover</span>
            </button>
          </div>

          <div
            className={`${
              isSearchFocused ? 'flex' : 'hidden md:flex'
            } flex-wrap items-center justify-center gap-2`}
          >
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-300">Popular:</span>
            {QUICK_SEARCH_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchQuery(term)}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-50/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-amber-500/10 dark:hover:bg-slate-700 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Category Filter Buttons */}
          <div
            className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 md:gap-3 overflow-x-auto overflow-y-hidden pb-1 snap-x snap-mandatory hide-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0"
            role="group"
            aria-label="Product categories"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <CategoryFilterButton key={category} filter={category} />
            ))}
          </div>

          {/* Brand, Sort & Advanced Filters Toggle */}
          <div className="hidden md:flex flex-col items-stretch justify-center gap-3 border-t border-amber-900/10 dark:border-amber-100/10 pt-4 dark:border-amber-100/10 sm:flex-row sm:items-center sm:gap-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <label
                htmlFor="brand-filter"
                className="font-semibold text-zinc-500 dark:text-zinc-300 text-sm whitespace-nowrap"
              >
                {t('filter_brand')}
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="brand-filter"
                  value={activeBrand}
                  onChange={handleBrandChange}
                  className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
                >
                  <option value="All">{t('filter_brand_all')}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 dark:text-zinc-300"
                  aria-hidden="true"
                >
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-by"
                className="font-semibold text-zinc-500 dark:text-zinc-300 text-sm whitespace-nowrap"
              >
                {t('filter_sort')}
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="sort-by"
                  value={sortOption}
                  onChange={handleSortChange}
                  className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
                >
                  <option value="default">{t('filter_sort_default')}</option>
                  <option value="price-asc">{t('filter_sort_price_asc')}</option>
                  <option value="price-desc">{t('filter_sort_price_desc')}</option>
                  <option value="rating-desc">{t('filter_sort_rating')}</option>
                  <option value="top-sold">{t('filter_sort_top_sold')}</option>
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 dark:text-zinc-300"
                  aria-hidden="true"
                >
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 touch-manipulation active:scale-95 ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-lg'
                  : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-500 dark:text-zinc-300 hover:bg-amber-500/10 dark:hover:bg-slate-600/50'
              }`}
              aria-controls="advanced-filters"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white/95 dark:bg-zinc-900/95 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          <section
            id="advanced-filters"
            aria-label="Filters and Sorting"
            className={`hidden overflow-hidden transition-all duration-500 ease-in-out md:block ${
              showAdvancedFilters
                ? 'max-h-[70dvh] md:max-h-[500px] opacity-100 overflow-y-auto overscroll-contain'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-amber-100/10 space-y-5">
              {/* Price Range Slider */}
              <div className="space-y-3">
                <label className="font-semibold text-zinc-500 dark:text-zinc-300 text-sm flex items-center gap-2">
                  {t('filter_price_range')}
                  <span className="text-orange-500 font-bold tabular-nums">
                    ৳{priceRange[0].toLocaleString('en-BD')} – ৳
                    {priceRange[1].toLocaleString('en-BD')}
                  </span>
                </label>
                <div className="flex items-center gap-3 sm:gap-4 max-w-xl">
                  <span className="text-xs text-zinc-500 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                    ৳{PRICE_MIN}
                  </span>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="min-price"
                        className="text-[10px] text-zinc-500 dark:text-zinc-300"
                      >
                        Min
                      </label>
                      <input
                        id="min-price"
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={10}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPriceRange((prev) => [Math.min(val, prev[1] - 10), prev[1]]);
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-zinc-900/95 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        aria-label="Minimum price"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="max-price"
                        className="text-[10px] text-zinc-500 dark:text-zinc-300"
                      >
                        Max
                      </label>
                      <input
                        id="max-price"
                        type="range"
                        min={PRICE_MIN}
                        max={PRICE_MAX}
                        step={10}
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPriceRange((prev) => [prev[0], Math.max(val, prev[0] + 10)]);
                        }}
                        className="w-full h-2 bg-slate-200 dark:bg-zinc-900/95 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                    ৳{PRICE_MAX.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              {/* Weight/Size & Min Rating Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Weight/Size Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <label
                    htmlFor="weight-filter"
                    className="font-semibold text-zinc-500 dark:text-zinc-300 text-sm whitespace-nowrap"
                  >
                    {t('filter_weight')}
                  </label>
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      id="weight-filter"
                      value={activeWeight}
                      onChange={(e) => setActiveWeight(e.target.value)}
                      className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
                    >
                      <option value="All">{t('filter_weight_all')}</option>
                      {weightOptions.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500 dark:text-zinc-300"
                      aria-hidden="true"
                    >
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Minimum Rating Filter */}
                <div className="flex items-center gap-2 flex-1">
                  <label className="font-semibold text-zinc-500 dark:text-zinc-300 text-sm whitespace-nowrap">
                    {t('filter_min_rating')}
                  </label>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMinRating(star)}
                        className={`p-1 rounded transition-all duration-200 touch-manipulation active:scale-90 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          minRating === star
                            ? 'bg-amber-500/10 dark:bg-amber-500/20 ring-2 ring-orange-500'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                        aria-label={star === 0 ? 'All ratings' : `${star} stars and up`}
                        title={star === 0 ? 'All' : `${star}★+`}
                      >
                        {star === 0 ? (
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-300 px-1">
                            {t('filter_min_rating_all')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <span className="text-yellow-500 text-sm">{'★'.repeat(star)}</span>
                            <span className="text-zinc-500 dark:text-zinc-300 text-sm">
                              {'★'.repeat(5 - star)}
                            </span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear All Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-orange-500 hover:text-orange-600 font-semibold underline underline-offset-2 transition-colors touch-manipulation"
                  >
                    {t('shop_clear_filters')} ({activeFiltersCount})
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Visible Result Count + Active Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 glass-card-ios border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-lg p-3 md:p-4">
          {!loading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-300" aria-live="polite">
              <span className="font-bold text-zinc-500 dark:text-zinc-300">{resultCount}</span>{' '}
              {t('shop_products_found')}
            </p>
          )}
          {activeFiltersCount > 0 && !showAdvancedFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold underline underline-offset-2 transition-colors touch-manipulation"
            >
              {t('shop_clear_filters')} ({activeFiltersCount})
            </button>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <div
            className="flex flex-nowrap items-center gap-2 mb-5 overflow-x-auto hide-scrollbar pb-1"
            aria-label="Active filters"
          >
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label={`Remove search filter ${searchQuery}`}
              >
                <span>Search: {searchQuery}</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {activeCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 whitespace-nowrap active:scale-95 transition-transform"
                aria-label={`Remove category filter ${activeCategory}`}
              >
                <span>Category: {activeCategory}</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {activeBrand !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveBrand('All')}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label={`Remove brand filter ${activeBrand}`}
              >
                <span>Brand: {activeBrand}</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {(priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) && (
              <button
                type="button"
                onClick={() => setPriceRange([PRICE_MIN, PRICE_MAX])}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label="Remove price range filter"
              >
                <span>
                  ৳{priceRange[0].toLocaleString('en-BD')}–৳{priceRange[1].toLocaleString('en-BD')}
                </span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {activeWeight !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveWeight('All')}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label={`Remove size filter ${activeWeight}`}
              >
                <span>Size: {activeWeight}</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {minRating > 0 && (
              <button
                type="button"
                onClick={() => setMinRating(0)}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label={`Remove minimum rating filter ${minRating} stars`}
              >
                <span>Rating: {minRating}★+</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {inStockOnly && (
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label="Remove in-stock filter"
              >
                <span>In Stock Only</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
            {sortOption !== 'default' && (
              <button
                type="button"
                onClick={() => setSortOption('default')}
                className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap active:scale-95 transition-transform"
                aria-label="Reset sort order"
              >
                <span>Sort: {sortOption}</span>
                <span aria-hidden="true" className="font-bold text-sm leading-none">
                  ×
                </span>
              </button>
            )}
          </div>
        )}

        {/* Results Count - Screen reader announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {!loading && `${resultCount} ${t('shop_products_found')}`}
        </div>

        {isDiscoveryMode ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner min-h-[600px] mt-6">
            <SwipeDiscovery
              products={sortedAndFilteredProducts}
              onComplete={() => setIsDiscoveryMode(false)}
            />
          </div>
        ) : (
          <>
            {!loading && error && (
              <div className="mb-6">
                <ApiStateCard
                  title="Shop inventory is temporarily unavailable"
                  message={error}
                  actionLabel="Retry"
                  onAction={refetch}
                />
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div
                className="flex justify-center items-center h-64"
                role="status"
                aria-label={t('shop_loading')}
              >
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
                <span className="sr-only">{t('shop_loading')}</span>
              </div>
            ) : !error && resultCount === 0 ? (
              <div className="text-center py-16 glass-card-ios">
                <p className="text-lg text-zinc-500 dark:text-zinc-300">{t('shop_no_results')}</p>
                <button
                  onClick={resetAllFilters}
                  className="mt-4 px-6 py-2 bg-amber-500 dark:bg-amber-600 text-white rounded-full font-semibold hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors touch-manipulation active:scale-95"
                >
                  {t('shop_clear_filters')}
                </button>
              </div>
            ) : !error ? (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '100px' }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
              >
                {sortedAndFilteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { type: 'spring', stiffness: 300, damping: 24 },
                      },
                    }}
                  >
                    <ProductCard product={product} onQuickView={handleQuickView} />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </>
        )}
      </main>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickViewModal product={selectedProduct} onClose={handleCloseQuickView} />
      )}

      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters and sorting"
        >
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(false)}
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            aria-label="Close filter overlay"
          />

          <aside className="absolute bottom-0 left-0 right-0 flex max-h-[86dvh] flex-col rounded-t-[2rem] border-t border-amber-900/10 dark:border-amber-100/10 bg-white dark:bg-zinc-900 shadow-[0_-18px_48px_rgba(15,23,42,0.28)]">
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 px-5 py-3.5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Filter & Sort</h2>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                aria-label="Close filters"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
              {/* Sort Radio Pills */}
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t('filter_sort')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'default', label: t('filter_sort_default') },
                      { value: 'top-sold', label: t('filter_sort_top_sold') },
                      { value: 'price-asc', label: t('filter_sort_price_asc') },
                      { value: 'price-desc', label: t('filter_sort_price_desc') },
                      { value: 'rating-desc', label: t('filter_sort_rating') },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortOption(opt.value)}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all active:scale-95 ${
                        sortOption === opt.value
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand & Size Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="brand-filter-mobile"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    {t('filter_brand')}
                  </label>
                  <select
                    id="brand-filter-mobile"
                    value={activeBrand}
                    onChange={handleBrandChange}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="All">{t('filter_brand_all')}</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="weight-filter-mobile"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    {t('filter_weight')}
                  </label>
                  <select
                    id="weight-filter-mobile"
                    value={activeWeight}
                    onChange={(e) => setActiveWeight(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="All">{t('filter_weight_all')}</option>
                    {weightOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {t('filter_price_range')}
                  </label>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    ৳{priceRange[0].toLocaleString('en-BD')} – ৳
                    {priceRange[1].toLocaleString('en-BD')}
                  </span>
                </div>
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={priceRange[0]}
                  aria-label="Minimum price"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPriceRange((prev) => [Math.min(val, prev[1] - 10), prev[1]]);
                  }}
                  className="w-full accent-orange-500"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={10}
                  value={priceRange[1]}
                  aria-label="Maximum price"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPriceRange((prev) => [prev[0], Math.max(val, prev[0] + 10)]);
                  }}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Rating Buttons (44px tall) */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t('filter_min_rating')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMinRating(star)}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        minRating === star
                          ? 'border-amber-500 bg-amber-500 text-white dark:text-zinc-950'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {star === 0 ? t('filter_min_rating_all') : `${star}★ & Up`}
                    </button>
                  ))}
                </div>
              </div>

              {/* In-Stock Toggle */}
              <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 px-4 py-3">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  In-Stock Items Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-5 w-5 rounded accent-amber-500"
                />
              </label>
            </div>

            {/* Sticky 2-Column Footer */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-5 pt-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={resetAllFilters}
                className="min-h-[48px] rounded-xl border border-orange-300 dark:border-orange-700/60 bg-amber-500/10 dark:bg-amber-500/15 text-sm font-bold text-orange-700 dark:text-orange-300 active:scale-95 transition-transform"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="min-h-[48px] rounded-xl bg-amber-500 text-white dark:bg-amber-500 dark:text-zinc-950 text-sm font-bold shadow-md active:scale-95 transition-transform"
              >
                Show {sortedAndFilteredProducts.length} Items
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default ShopPage;
