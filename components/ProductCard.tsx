import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon, EyeIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Check if item is in cart
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };
  
  const handleQuickViewClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onQuickView) {
          onQuickView(product);
      }
  };

  return (
    <div className="glass-card group overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-[4/3] sm:aspect-square">
        <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110" 
            loading="lazy" 
            decoding="async"
        />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-orange-500/90 backdrop-blur-sm text-white text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm z-10">
          {product.category}
        </div>
        
        {/* Quick View Button */}
        {onQuickView && (
            <button
                onClick={handleQuickViewClick}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 p-1.5 sm:p-2 rounded-full shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:text-orange-500 z-10 active:scale-95"
                title="Quick View"
            >
                <EyeIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
        )}

        {/* In Cart Badge */}
        {quantityInCart > 0 && (
            <div className="absolute bottom-2 left-2 bg-green-600/95 backdrop-blur-md text-white text-[9px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-lg z-10 flex items-center gap-1 animate-scale-in">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">In Cart:</span> {quantityInCart}
            </div>
        )}
      </Link>
      
      <div className="p-2 sm:p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
             <h3 className="text-xs sm:text-lg font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight min-h-[2.5em]" title={product.name}>{product.name}</h3>
        </Link>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 sm:mt-2 text-[10px] sm:text-sm">{product.weight}</p>
        <div className="flex justify-between items-end mt-1 sm:mt-4 mb-1 sm:mb-3">
          <p className="text-sm sm:text-xl font-extrabold text-slate-800 dark:text-white">
            ৳<span className="ml-0.5">{product.price}</span>
          </p>
           {product.rating > 0 && (
            <div className="flex items-center space-x-0.5 sm:space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-1 sm:px-2 py-0.5 rounded-md">
                <span className="text-yellow-500 text-[10px] sm:text-sm">★</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-[10px] sm:text-sm">{product.rating.toFixed(1)}</span>
            </div>
           )}
        </div>
      </div>
      <div className="p-2 sm:p-4 bg-white/50 dark:bg-black/20 mt-auto flex flex-col gap-2 border-t border-white/20 dark:border-slate-700/30">
        <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full flex items-center justify-center space-x-1.5 py-1.5 sm:py-2.5 rounded-lg text-[10px] sm:text-sm font-bold transition-all duration-200 
            ${isAdding 
                ? 'bg-green-500 text-white cursor-default scale-95' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg active:scale-95'}`}
        >
             <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
             <span>{isAdding ? 'Added' : (quantityInCart > 0 ? `Add (${quantityInCart})` : 'Add to Cart')}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);