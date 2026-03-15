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
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
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
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 sm:mt-2 text-[10px] sm:text-sm">
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
