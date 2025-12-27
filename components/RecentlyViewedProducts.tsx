import React from 'react';
import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../contexts/RecentlyViewedContext';
import type { Product } from '../types';

interface RecentlyViewedProductsProps {
  currentProductId?: number;
  maxItems?: number;
  className?: string;
}

const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({
  currentProductId,
  maxItems = 6,
  className = '',
}) => {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // Filter out current product and limit items
  const productsToShow = recentlyViewed.filter((p) => p.id !== currentProductId).slice(0, maxItems);

  if (productsToShow.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
          Recently Viewed
        </h2>
        <button
          onClick={clearRecentlyViewed}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {productsToShow.map((product) => (
          <RecentlyViewedItem key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

const RecentlyViewedItem: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="flex-shrink-0 w-36 sm:w-44 glass-card overflow-hidden group hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {product.rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 leading-tight mb-1 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm font-bold text-orange-600 dark:text-orange-400">৳{product.price}</p>
      </div>
    </Link>
  );
};

export default RecentlyViewedProducts;
