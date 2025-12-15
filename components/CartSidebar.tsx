import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { CloseIcon, PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon } from './icons';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

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
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close cart"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-5">
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
                  className="mt-6 text-orange-600 font-bold hover:underline"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {cartItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-200 dark:bg-slate-700"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                        ৳{item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-3 mt-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-slate-800 dark:text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors self-start"
                      aria-label={`Remove ${item.name}`}
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
            <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
              <div className="flex justify-between items-center text-xl font-bold mb-6">
                <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                <span className="text-slate-800 dark:text-white">৳{cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-orange-500 text-white font-bold py-4 px-4 rounded-xl text-lg hover:bg-orange-600 transition-colors shadow-lg active:scale-95 transform duration-150"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={clearCart}
                className="w-full text-center mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
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
