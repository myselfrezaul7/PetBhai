import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon } from './icons';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cartItems, cartCount, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { confirm } = useConfirmation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trapping: cycle through focusable elements
      if (e.key === 'Tab' && sidebarRef.current) {
        const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCheckout = useCallback(() => {
    onClose();
    navigate('/checkout');
  }, [onClose, navigate]);

  const handleIncreaseQuantity = useCallback(
    (itemId: number, currentQuantity: number) => {
      // Limit max quantity to prevent abuse
      if (currentQuantity >= 99) return;
      updateQuantity(itemId, currentQuantity + 1);
    },
    [updateQuantity]
  );

  const handleDecreaseQuantity = useCallback(
    (itemId: number, currentQuantity: number) => {
      if (currentQuantity > 1) {
        updateQuantity(itemId, currentQuantity - 1);
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (itemId: number, itemName: string) => {
      const confirmed = await confirm({
        title: 'Remove Item',
        message: `Remove "${itemName}" from your cart?`,
        confirmText: 'Remove',
        cancelText: 'Keep',
      });
      if (confirmed) {
        removeFromCart(itemId);
      }
    },
    [confirm, removeFromCart]
  );

  const handleClearCart = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Cart',
      message: 'Are you sure you want to remove all items from your cart?',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
    });
    if (confirmed) {
      clearCart();
    }
  }, [confirm, clearCart]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    touchCurrentXRef.current = touchStartXRef.current;
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLElement>) => {
    touchCurrentXRef.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartXRef.current === null || touchCurrentXRef.current === null) {
      return;
    }

    const deltaX = touchCurrentXRef.current - touchStartXRef.current;
    if (deltaX > 80) {
      onClose();
    }

    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-xl transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`safe-top safe-bottom fixed inset-x-0 bottom-0 top-auto z-50 h-[85vh] w-full transform rounded-t-[2.2rem] border-t border-white/55 bg-white/95 shadow-[0_-24px_60px_rgba(0,0,0,0.15)] backdrop-blur-glass transition-transform duration-500 ease-out dark:border-white/10 dark:bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92))] md:top-0 md:bottom-auto md:right-0 md:left-auto md:h-full md:w-full md:max-w-md md:rounded-l-[2.2rem] md:rounded-tr-none md:border-l md:border-t-0 md:shadow-[0_24px_60px_rgba(0,0,0,0.08)] ${
          isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-white/20 p-5 dark:border-white/10">
            <div>
              <h2
                id="cart-heading"
                className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"
              >
                <ShoppingCartIcon className="w-6 h-6 text-orange-500" />
                Your Cart
                {cartCount > 0 && (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                    ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-300">
                Swipe right to close
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="glass-pill p-2 text-slate-500 transition-all duration-300 touch-manipulation active:scale-95 dark:text-zinc-300"
              aria-label="Close cart"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-5 overscroll-contain">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-300">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <ShoppingCartIcon className="w-16 h-16 text-slate-400 dark:text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-sm max-w-xs">
                  Looks like you haven't added any treats for your furry friend yet.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 text-orange-600 font-bold hover:underline touch-manipulation active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <motion.ul
                className="space-y-4"
                role="list"
                aria-label="Cart items"
                initial="hidden"
                animate={isOpen ? 'visible' : 'hidden'}
                variants={{
                  hidden: { opacity: 1 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
                  },
                }}
              >
                {cartItems.map((item) => (
                  <motion.li
                    key={item.id}
                    className="glass-card-premium flex items-center space-x-4 rounded-2xl p-4"
                    variants={{
                      hidden: { opacity: 0, y: 14, scale: 0.98 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: 'easeOut' } },
                    }}
                    drag="x"
                    dragDirectionLock
                    dragConstraints={{ left: -120, right: 0 }}
                    dragElastic={0.08}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -112) {
                        handleRemoveItem(item.id, item.name);
                      }
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-200 dark:bg-slate-700"
                      loading="lazy"
                      decoding="async"
                      sizes="80px"
                      onError={(event) => {
                        const target = event.currentTarget;
                        target.onerror = null;
                        target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 rx=%2212%22 fill=%22%23fed7aa%22/%3E%3Cpath d=%22M20 52h40M28 40l8-8 8 8 8-8 8 8%22 stroke=%22%23f97316%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 fill=%22none%22/%3E%3C/svg%3E';
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                        ৳{item.price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                        Swipe left to remove
                      </div>
                      <div className="flex items-center space-x-3 mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                          disabled={item.quantity <= 1}
                          className="glass-pill flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-600 transition-colors touch-manipulation active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span
                          className="font-bold text-slate-800 dark:text-white w-8 text-center tabular-nums"
                          aria-label={`Quantity: ${item.quantity}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncreaseQuantity(item.id, item.quantity)}
                          disabled={item.quantity >= 99}
                          className="glass-pill flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-600 transition-colors touch-manipulation active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors self-start touch-manipulation active:scale-95"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <footer className="safe-bottom sticky bottom-0 border-t border-white/30 bg-white/90 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-[0_-16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95 sm:px-6 sm:pt-6">
              <div className="mb-4 sm:mb-6 flex items-center justify-between rounded-xl bg-orange-50/50 p-4 dark:bg-orange-500/10">
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">Subtotal</span>
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400 tabular-nums" aria-live="polite">
                  ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="group relative w-full overflow-hidden rounded-xl bg-orange-500 px-4 py-4 text-base font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.25)] transition-all duration-300 hover:bg-orange-600 hover:shadow-[0_12px_24px_rgba(249,115,22,0.35)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 active:scale-[0.98] touch-manipulation sm:text-lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Proceed to Checkout
                  <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className="mt-4 w-full py-2 text-center text-sm font-semibold tracking-wide text-slate-400 transition-colors hover:text-red-500 touch-manipulation active:scale-95 dark:text-slate-500 dark:hover:text-red-400"
              >
                Clear Cart
              </button>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
};

export default React.memo(CartSidebar);
