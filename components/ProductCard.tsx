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
    <div className="glass-card overflow-hidden flex flex-col group transition-transform transform hover:-translate-y-2 h-full">
      <Link to={`/product/${product.id}`} className="relative block">
        <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" loading="lazy" />
        <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full opacity-90">
          {product.category}
        </div>
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-2" title={product.name}>{product.name}</h3>
        </Link>
        <p className="text-slate-600 dark:text-slate-300 font-medium mt-1 text-sm">{product.weight}</p>
        <div className="flex justify-between items-end mt-4 mb-2">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
            ৳<span className="ml-1">{product.price}</span>
          </p>
           {product.rating > 0 && (
            <div className="flex items-center space-x-1">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{product.rating.toFixed(1)}</span>
            </div>
           )}
        </div>
      </div>
      <div className="p-4 bg-black/5 dark:bg-black/10 mt-auto flex gap-2">
        <button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 
            ${isAdding 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'}`}
        >
             <ShoppingCartIcon className="w-4 h-4" />
             <span>{isAdding ? 'Added' : 'Add to Cart'}</span>
        </button>
        <Link 
            to={`/product/${product.id}`}
            className="flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all hover:shadow-sm"
        >
            View Details
        </Link>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);