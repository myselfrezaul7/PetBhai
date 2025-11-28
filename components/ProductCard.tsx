import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon } from './icons';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className="glass-card group overflow-hidden flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-36 sm:h-56 object-cover transform transition-transform duration-500 group-hover:scale-110" 
            loading="lazy" 
        />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm">
          {product.category}
        </div>
      </Link>
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
             <h3 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight" title={product.name}>{product.name}</h3>
        </Link>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 sm:mt-2 text-xs sm:text-sm">{product.weight}</p>
        <div className="flex justify-between items-end mt-2 sm:mt-4 mb-1 sm:mb-3">
          <p className="text-base sm:text-2xl font-extrabold text-slate-800 dark:text-white">
            ৳<span className="ml-0.5">{product.price}</span>
          </p>
           {product.rating > 0 && (
            <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 sm:px-2 py-0.5 rounded-md">
                <span className="text-yellow-500 text-xs sm:text-sm">★</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{product.rating.toFixed(1)}</span>
            </div>
           )}
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/20 mt-auto flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-white/20 dark:border-slate-700/30">
        <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 
            ${isAdding 
                ? 'bg-green-500 text-white cursor-default scale-95' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg active:scale-95'}`}
        >
             <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
             <span>{isAdding ? 'Added' : 'Add to Cart'}</span>
        </button>
        <Link 
            to={`/product/${product.id}`}
            className="flex-1 flex items-center justify-center py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
        >
            Details
        </Link>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);