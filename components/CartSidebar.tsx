import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { CloseIcon, PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon } from './icons';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { confirm } = useConfirmation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    (itemId: number, currentQuantity: number, itemName: string) => {
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

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
            <h2
              id="cart-heading"
              className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"
            >
              <ShoppingCartIcon className="w-6 h-6 text-orange-500" />
              Your Cart
              {cartItems.length > 0 && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation active:scale-95"
              aria-label="Close cart"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-5 overscroll-contain">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <ShoppingCartIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-sm max-w-xs">
                  Looks like you haven't added any treats for your furry friend yet.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 text-orange-600 font-bold hover:underline touch-manipulation active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-4" role="list" aria-label="Cart items">
                {cartItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                  >
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-200 dark:bg-slate-700"
                      loading="lazy"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                        ৳{item.price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center space-x-3 mt-3">
                        <button
                          onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                          disabled={item.quantity <= 1}
                          className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          onClick={() => handleIncreaseQuantity(item.id, item.quantity, item.name)}
                          disabled={item.quantity >= 99}
                          className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors self-start touch-manipulation active:scale-95"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <footer className="p-5 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                <span className="text-slate-800 dark:text-white tabular-nums">
                  ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-orange-500 text-white font-bold py-3.5 sm:py-4 px-4 rounded-xl text-base sm:text-lg hover:bg-orange-600 transition-colors shadow-lg touch-manipulation active:scale-[0.98] transform duration-150 focus:outline-none focus:ring-4 focus:ring-orange-300"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={handleClearCart}
                className="w-full text-center mt-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors touch-manipulation active:scale-95"
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

export default CartSidebar;
