import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { CloseIcon, ShoppingCartIcon } from './icons';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  // Check if item is in cart
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 bg-white/80 dark:bg-black/50 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm backdrop-blur-md"
            aria-label="Close modal"
        >
            <CloseIcon className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>
        
        {/* Image Section - Fixed width on desktop, full height coverage */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-800 relative flex-shrink-0">
            <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                {product.category}
            </div>
        </div>

        {/* Details Section - Scrollable content */}
        <div className="w-full md:w-1/2 flex flex-col p-6 md:p-10 overflow-y-auto">
            <div className="flex-grow">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight mb-2 pr-8">{product.name}</h2>
                <div className="flex items-center space-x-3 mb-6">
                    <StarRatingDisplay rating={product.rating} />
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">({product.reviews.length} reviews)</span>
                </div>
                
                <div className="mb-6">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">৳{product.price}</p>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Weight: {product.weight}</p>
                </div>

                <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    <p>{product.description}</p>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-4 mt-auto">
                <button 
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg
                    ${isAdding 
                        ? 'bg-green-500 text-white scale-95 cursor-default' 
                        : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-500/25 active:scale-95'}`}
                >
                    <ShoppingCartIcon className="w-5 h-5" />
                    <span>{isAdding ? 'Added to Cart' : (quantityInCart > 0 ? `Add More (${quantityInCart} in Cart)` : 'Add to Cart')}</span>
                </button>
                <Link 
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl font-bold text-center border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
                >
                    View Full Details
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;