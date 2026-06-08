import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { CloseIcon, ShoppingCartIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';
import { useHaptics } from '../hooks/useHaptics';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose }) => {
  const { t } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const { hapticLight, hapticSuccess, triggerCustom } = useHaptics();
  const [isAdding, setIsAdding] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  if (!product) return null;

  // Check if item is in cart
  const cartItem = cartItems.find((item) => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    triggerCustom(20);
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  return (
    <motion.div
      className="safe-modal-padding fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-end md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row max-h-[min(92dvh,42rem)] landscape:max-h-[80dvh]"
        onClick={(e) => e.stopPropagation()}
        initial={isDesktop ? { opacity: 0, y: 20, scale: 0.98 } : { opacity: 0, y: 80 }}
        animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
        exit={isDesktop ? { opacity: 0, y: 20, scale: 0.98 } : { opacity: 0, y: 90 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        drag={isDesktop ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={isDesktop ? 0 : 0.2}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (!isDesktop && info.offset.y > 120) {
            onClose();
          }
        }}
      >
        {!isDesktop && (
          <div className="absolute left-1/2 top-2.5 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-300/90 dark:bg-slate-600/90" />
        )}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/80 dark:bg-black/50 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm backdrop-blur-md"
          aria-label={t('aria_close_modal')}
        >
          <CloseIcon className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>

        {/* Image Section - Fixed width on desktop, full height coverage */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-800 relative flex-shrink-0 group">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            sizes={getResponsiveImageSizes('detail')}
            onError={handleImageError}
          />
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            {product.category}
          </div>
        </div>

        {/* Details Section - Scrollable content */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto overscroll-contain">
          <div className="p-6 md:p-10">
          <div className="flex-grow">
            <h2
              id="quick-view-title"
              className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight mb-2 pr-8"
            >
              {product.name}
            </h2>
            <div className="flex items-center space-x-3 mb-6">
              <StarRatingDisplay rating={product.rating} />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                ({product.reviews.length} {t('label_reviews')})
              </span>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                ৳{product.price}
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-1">
                {t('label_weight')} {product.weight}
              </p>
            </div>

            <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              <p>{product.description}</p>
            </div>
          </div>
          </div>

          <div className="sticky bottom-0 z-10 mt-auto border-t border-slate-200 bg-white/92 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/92 md:static md:border-t md:bg-transparent md:p-6 md:pt-6 md:backdrop-blur-0">
            <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg
                    ${
                      isAdding
                        ? 'bg-green-500 text-white scale-95 cursor-default'
                        : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-500/25 active:scale-95 animate-pulse'
                    }`}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span>
                {isAdding
                  ? t('btn_added_full')
                  : quantityInCart > 0
                    ? `${t('btn_add_more')} (${quantityInCart} ${t('text_in_cart')})`
                    : t('btn_add_to_cart')}
              </span>
            </button>
            <Link
              to={`/product/${product.id}`}
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold text-center border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t('btn_view_full_details')}
            </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductQuickViewModal;
