import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useBrands } from '../contexts/BrandContext';
import { SearchIcon } from '../components/icons';
import type { Product } from '../types';
import { useProducts } from '../contexts/ProductContext';
import ProductQuickViewModal from '../components/ProductQuickViewModal';
import { sanitizeInput } from '../lib/security';

type CategoryFilter =
  | 'All'
  | 'Dog Food'
  | 'Cat Food'
  | 'Dog Supplies'
  | 'Cat Supplies'
  | 'Grooming';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';

// Category options for DRY principle
const CATEGORY_OPTIONS: CategoryFilter[] = [
  'All',
  'Dog Food',
  'Cat Food',
  'Dog Supplies',
  'Cat Supplies',
  'Grooming',
];

const ShopPage: React.FC = () => {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [activeBrand, setActiveBrand] = useState<string>(location.state?.brand || 'All');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products: allProducts, loading } = useProducts();
  const { brands } = useBrands();

  // Reset brand filter when coming from external navigation
  useEffect(() => {
    if (location.state?.brand) {
      setActiveBrand(location.state.brand);
    }
  }, [location.state?.brand]);

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

    // 4. Sort - use stable sort for consistent results
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
      default:
        // Default sort (e.g., by ID or as is)
        break;
    }

    return products;
  }, [activeCategory, activeBrand, sortOption, searchQuery, allProducts, brands, loading]);

  // Memoized category button component
  const CategoryFilterButton: React.FC<{ filter: CategoryFilter }> = useCallback(
    ({ filter }) => (
      <button
        onClick={() => handleCategoryChange(filter)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          activeCategory === filter
            ? 'bg-orange-500 text-white shadow-lg transform scale-105'
            : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
        }`}
        aria-pressed={activeCategory === filter ? 'true' : 'false'}
        aria-label={`Filter by ${filter}`}
      >
        {filter}
      </button>
    ),
    [activeCategory, handleCategoryChange]
  );

  // Calculate result count for accessibility
  const resultCount = sortedAndFilteredProducts.length;

  return (
    <>
      <main className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
        <header className="text-center mb-6 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-800 dark:text-white mb-3 md:mb-4">
            Shop For Your Buddy
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-2">
            Find everything you need to keep your pet happy and healthy, from premium food to fun
            toys.
          </p>
        </header>

        {/* Filters & Sorting */}
        <div className="glass-card p-4 sm:p-6 mb-8 md:mb-12 space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
              <SearchIcon
                className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
            </span>
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm focus:shadow-md touch-manipulation"
              aria-label="Search products"
              autoComplete="off"
            />
          </div>

          {/* Category Filter Buttons */}
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3"
            role="group"
            aria-label="Product categories"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <CategoryFilterButton key={category} filter={category} />
            ))}
          </div>

          {/* Brand & Sort Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <label
                htmlFor="brand-filter"
                className="font-semibold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap"
              >
                Brand:
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="brand-filter"
                  value={activeBrand}
                  onChange={handleBrandChange}
                  className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
                >
                  <option value="All">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300"
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
                className="font-semibold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap"
              >
                Sort by:
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="sort-by"
                  value={sortOption}
                  onChange={handleSortChange}
                  className="appearance-none w-full sm:w-auto pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300"
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
          </div>
        </div>

        {/* Results Count - Screen reader announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {!loading && `${resultCount} products found`}
        </div>

        {/* Loading State */}
        {loading ? (
          <div
            className="flex justify-center items-center h-64"
            role="status"
            aria-label="Loading products"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
            <span className="sr-only">Loading products...</span>
          </div>
        ) : resultCount === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              No products found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setActiveBrand('All');
              }}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {sortedAndFilteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
            ))}
          </div>
        )}
      </main>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickViewModal product={selectedProduct} onClose={handleCloseQuickView} />
      )}
    </>
  );
};

export default ShopPage;
