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
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 id="cart-heading" className="text-2xl font-bold text-slate-800">Your Cart</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close cart"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <ShoppingCartIcon className="w-24 h-24 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold">Your cart is empty</h3>
                <p className="mt-1">Add items from the shop to get started.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {cartItems.map(item => (
                  <li key={item.id} className="flex items-center space-x-4 bg-white p-3 rounded-lg shadow-sm">
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                      <p className="text-sm text-slate-500">৳{item.price.toFixed(2)}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><MinusIcon className="w-4 h-4" /></button>
                        <span className="font-semibold w-6 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-slate-200 hover:bg-slate-300"><PlusIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-red-600" aria-label={`Remove ${item.name}`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <footer className="p-4 border-t border-slate-200 bg-white">
                 <button onClick={clearCart} className="text-sm text-slate-500 hover:text-red-600 hover:underline mb-4 text-left">Clear Cart</button>
                 <div className="flex justify-between items-center text-xl font-bold mb-4">
                    <span>Subtotal:</span>
                    <span>৳{cartTotal.toFixed(2)}</span>
                 </div>
                 <button onClick={handleCheckout} className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors">
                    Proceed to Checkout
                 </button>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartSidebar;