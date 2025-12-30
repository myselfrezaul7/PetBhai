import React from 'react';
import { Link } from 'react-router-dom';
import type { Product, Article, Vet, Animal } from '../types';
import {
  SearchIcon,
  PawIcon,
  UserIcon,
  ShoppingCartIcon,
  ClockIcon,
  StarIcon,
  BookOpenIcon,
} from './icons';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PageResult {
  name: string;
  path: string;
}

export interface SearchResultsData {
  products: Product[];
  pages: PageResult[];
  articles: Article[];
  vets: Vet[];
  animals: Animal[];
}

interface SearchResultsProps {
  id: string;
  query: string;
  results: SearchResultsData;
  loading: boolean;
  onClose: () => void;
  activeIndex?: number;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  id,
  query,
  results,
  loading,
  onClose,
  activeIndex = -1,
}) => {
  const { cartItems } = useCart();
  const { t } = useLanguage();
  const hasResults =
    results.products.length > 0 ||
    results.pages.length > 0 ||
    results.articles.length > 0 ||
    results.vets.length > 0 ||
    results.animals.length > 0;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100 rounded-sm px-0.5 font-bold"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div
      id={id}
      className="absolute top-full mt-2 w-full md:w-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-700 transform origin-top animate-scale-in"
      aria-label="Search results"
    >
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Searching for "{query}"...
            </p>
          </div>
        ) : query && !hasResults ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-bold text-slate-800 dark:text-white text-lg">
              {t('search_no_results')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              We couldn't find anything matching "{query}".
            </p>
            <button
              onClick={() => onClose()}
              className="mt-4 text-orange-500 font-semibold hover:underline"
            >
              {t('search_clear')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Pages Results */}
            {results.pages.length > 0 && (
              <div className="p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 flex items-center">
                  <SearchIcon className="w-3 h-3 mr-1.5" />
                  {t('search_quick_links')}
                </h3>
                <div className="space-y-1">
                  {results.pages.map((page, idx) => (
                    <Link
                      key={`page-${page.path}`}
                      to={page.path}
                      onClick={onClose}
                      className={`flex items-center space-x-3 p-2.5 rounded-lg transition-all ${
                        activeIndex === idx
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <SearchIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{highlightText(page.name, query)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products Results */}
            {results.products.length > 0 && (
              <div className="p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 flex items-center">
                  <ShoppingCartIcon className="w-3 h-3 mr-1.5" />
                  {t('search_products')}
                </h3>
                <div className="space-y-1">
                  {results.products.map((product, idx) => {
                    const globalIdx = results.pages.length + idx;
                    const isInCart = cartItems.some((item) => item.id === product.id);
                    return (
                      <Link
                        key={`product-${product.id}`}
                        to={`/product/${product.id}`}
                        onClick={onClose}
                        className={`flex items-center space-x-4 p-2.5 rounded-lg transition-all ${
                          activeIndex === globalIdx
                            ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-sm"
                          />
                          {product.discount && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded-sm">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">
                            {highlightText(product.name, query)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                              ৳{product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-slate-400 dark:text-slate-500 text-xs line-through">
                                ৳{product.originalPrice}
                              </span>
                            )}
                            {isInCart && (
                              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                                {t('search_in_cart')}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vets Results */}
            {results.vets.length > 0 && (
              <div className="p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 flex items-center">
                  <UserIcon className="w-3 h-3 mr-1.5" />
                  {t('search_vets')}
                </h3>
                <div className="space-y-1">
                  {results.vets.map((vet, idx) => {
                    const globalIdx = results.pages.length + results.products.length + idx;
                    return (
                      <Link
                        key={`vet-${vet.id}`}
                        to={`/vet/${vet.id}`}
                        onClick={onClose}
                        className={`flex items-center space-x-4 p-2.5 rounded-lg transition-all ${
                          activeIndex === globalIdx
                            ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <img
                          src={vet.imageUrl}
                          alt={vet.name}
                          className="w-12 h-12 object-cover rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                        />
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">
                            {highlightText(vet.name, query)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {vet.specialization} • {vet.clinicName}
                          </p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${vet.availability === 'Available Now' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}
                        ></div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Animals Results */}
            {results.animals.length > 0 && (
              <div className="p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 flex items-center">
                  <PawIcon className="w-3 h-3 mr-1.5" />
                  {t('search_adoption')}
                </h3>
                <div className="space-y-1">
                  {results.animals.map((animal, idx) => {
                    const globalIdx =
                      results.pages.length + results.products.length + results.vets.length + idx;
                    return (
                      <Link
                        key={`animal-${animal.id}`}
                        to={`/adopt/${animal.id}`}
                        onClick={onClose}
                        className={`flex items-center space-x-4 p-2.5 rounded-lg transition-all ${
                          activeIndex === globalIdx
                            ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <img
                          src={animal.imageUrl}
                          alt={animal.name}
                          className="w-12 h-12 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">
                            {highlightText(animal.name, query)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {animal.breed} • {animal.age}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            animal.status === 'Available'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {animal.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Articles Results */}
            {results.articles.length > 0 && (
              <div className="p-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 flex items-center">
                  <BookOpenIcon className="w-3 h-3 mr-1.5" />
                  {t('search_blog')}
                </h3>
                <div className="space-y-1">
                  {results.articles.map((article, idx) => {
                    const globalIdx =
                      results.pages.length +
                      results.products.length +
                      results.vets.length +
                      results.animals.length +
                      idx;
                    return (
                      <Link
                        key={`article-${article.id}`}
                        to={`/blog/${article.id}`}
                        onClick={onClose}
                        className={`flex items-center space-x-4 p-2.5 rounded-lg transition-all ${
                          activeIndex === globalIdx
                            ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                          <BookOpenIcon className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">
                            {highlightText(article.title, query)}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="truncate">
                              {t('search_by')} {article.author}
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {article.readTime} {t('blog_min_read').split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasResults && !loading && (
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {t('search_navigation_tip').split('↑↓')[0]}
            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              ↑↓
            </kbd>
            {t('search_navigation_tip').split('↑↓')[1].split('Enter')[0]}
            <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              Enter
            </kbd>
            {t('search_navigation_tip').split('Enter')[1]}
          </p>
          <Link
            to={`/shop?search=${encodeURIComponent(query)}`}
            onClick={onClose}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            {t('search_view_all')} →
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
