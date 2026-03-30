import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon, EyeIcon } from './icons';
import StockBadge from './StockBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  variant?: 'default' | 'mobile-featured' | 'mobile-list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, variant = 'default' }) => {
  const { t } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const addingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (addingTimerRef.current) clearTimeout(addingTimerRef.current);
    };
  }, []);

  // Check if item is in cart
  const cartItem = cartItems.find((item) => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  // Check stock status
  const isOutOfStock = product.stockStatus === 'out-of-stock';
  const isLowStock = product.stockStatus === 'low-stock';

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isAdding || isOutOfStock) return;

      setIsAdding(true);
      addToCart(product);
      addingTimerRef.current = setTimeout(() => setIsAdding(false), 800);
    },
    [addToCart, product, isAdding, isOutOfStock]
  );

  const handleQuickViewClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onQuickView) {
        onQuickView(product);
      }
    },
    [onQuickView, product]
  );

  if (variant === 'mobile-list') {
    return (
      <Link
        to={`/product/${product.id}`}
        className="group relative flex items-center gap-3 rounded-3xl border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 p-3 shadow-[0_12px_26px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,0,0,0.08)] dark:border-amber-100/10 dark:bg-zinc-900/95"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`h-20 w-20 shrink-0 rounded-2xl object-cover transition-all duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
          loading="lazy"
          decoding="async"
          sizes={getResponsiveImageSizes('card')}
          onError={handleImageError}
        />

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{product.description}</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-3xl font-bold leading-none text-amber-600 dark:text-amber-500">
              ৳{product.price.toLocaleString('en-BD')}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-through">
                ৳{product.originalPrice.toLocaleString('en-BD')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          aria-label={
            isOutOfStock ? t('aria_out_of_stock') : `${t('aria_add_to_cart')} ${product.name}`
          }
          className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md transition-all ${
            isOutOfStock
              ? 'bg-slate-400/80 cursor-not-allowed'
              : isAdding
                ? 'bg-emerald-600 scale-95 animate-badge-pop'
                : 'bg-amber-500 dark:bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 active:scale-95'
          }`}
        >
          <ShoppingCartIcon className="h-4 w-4" />
        </button>
      </Link>
    );
  }

  if (variant === 'mobile-featured') {
    return (
      <div className="group relative overflow-hidden rounded-[2rem] border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 p-2 shadow-[0_14px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-amber-100/10 dark:bg-zinc-900/95">
        <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-[1.5rem]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`aspect-[4/5] w-full object-cover transition-all duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
            loading="lazy"
            decoding="async"
            sizes={getResponsiveImageSizes('card')}
            onError={handleImageError}
          />
        </Link>

        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-amber-900/10 dark:border-amber-100/10 bg-white/80 text-slate-700 shadow-sm dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-slate-200"
          aria-label={`Save ${product.name} to wishlist`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 12 5.08 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
          </svg>
        </button>

        <div className="px-2 pb-2 pt-3">
          <Link to={`/product/${product.id}`}>
            <h3 className="line-clamp-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{product.name}</h3>
          </Link>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-bold leading-none text-amber-600 dark:text-amber-500">
              ৳{product.price.toLocaleString('en-BD')}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-through">
                ৳{product.originalPrice.toLocaleString('en-BD')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <Link
        to={`/product/${product.id}`}
        className="relative block overflow-hidden aspect-[4/3] sm:aspect-square"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
          loading="lazy"
          decoding="async"
          sizes={getResponsiveImageSizes('card')}
          onError={handleImageError}
        />
        <div className="absolute right-2 top-2 z-10 rounded-full border border-slate-300 bg-white/95 px-2 py-0.5 text-[9px] font-bold text-slate-700 sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs dark:border-slate-700 dark:bg-slate-950/95 dark:text-zinc-200">
          {product.category}
        </div>

        {/* Stock Badge */}
        {(isOutOfStock || isLowStock) && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10">
            <StockBadge status={product.stockStatus || 'in-stock'} size="sm" />
          </div>
        )}

        {/* Quick View Button */}
        {onQuickView && (
          <button
            onClick={handleQuickViewClick}
            className="absolute left-2 top-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-300 bg-white/95 p-2 text-slate-700 opacity-100 transition-all duration-500 hover:text-slate-900 active:scale-95 sm:left-3 sm:top-3 sm:opacity-0 sm:group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-950/95 dark:text-zinc-300 dark:hover:text-white"
            title="Quick View"
            aria-label={`Quick view ${product.name}`}
          >
            <EyeIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* In Cart Badge */}
        {quantityInCart > 0 && (
          <div className="absolute bottom-2 left-2 rounded-lg bg-green-600 text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-md z-10 flex items-center gap-1 animate-scale-in">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></span>
            <span className="hidden sm:inline">In Cart:</span> {quantityInCart}
          </div>
        )}

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md z-10">
            -{product.discount}%
          </div>
        )}
      </Link>

      <div className="p-2 sm:p-5 flex flex-col flex-grow">
        <Link
          to={`/product/${product.id}`}
          className="block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200"
        >
          <h3
            className="text-xs sm:text-lg font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight min-h-[2.5em]"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 sm:mt-2 text-[10px] sm:text-sm">
          {product.weight}
        </p>
        <div className="flex justify-between items-end mt-1 sm:mt-4 mb-1 sm:mb-3">
          <div className="flex flex-col">
            <p className="text-sm sm:text-xl font-extrabold text-slate-800 dark:text-white tabular-nums">
              ৳<span className="ml-0.5">{product.price.toLocaleString('en-BD')}</span>
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-[9px] sm:text-xs text-slate-400 line-through tabular-nums">
                ৳{product.originalPrice.toLocaleString('en-BD')}
              </p>
            )}
          </div>
          {product.rating > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center space-x-0.5 sm:space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 sm:px-2 py-0.5 rounded-md">
                <span className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-[8px] sm:text-xs ${
                        star <= Math.round(product.rating)
                          ? 'text-yellow-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-sm tabular-nums">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              {product.reviews && product.reviews.length > 0 && (
                <span className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                  ({product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          aria-label={
            isOutOfStock ? t('aria_out_of_stock') : `${t('aria_add_to_cart')} ${product.name}`
          }
          className={`w-full min-h-[44px] flex items-center justify-center space-x-1.5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-500 ease-out touch-manipulation
            ${
              isOutOfStock
                ? 'bg-slate-300/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                : isAdding
                    ? 'bg-emerald-600 text-white cursor-default scale-95'
                    : 'bg-slate-950 text-white hover:bg-black shadow-md active:scale-95'
            }`}
        >
          <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>
            {isOutOfStock
              ? t('btn_out_of_stock')
              : isAdding
                ? t('btn_added')
                : quantityInCart > 0
                  ? `${t('btn_add_more')} (${quantityInCart})`
                  : t('btn_add_to_cart')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
