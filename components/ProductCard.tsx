import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Link to={`/product/${product.id}`} className="glass-card overflow-hidden flex flex-col group transition-transform transform hover:-translate-y-2">
      <div className="relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" loading="lazy" />
        <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full opacity-90">
          {product.category}
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-wider">View Details</p>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex-grow line-clamp-2">{product.name}</h3>
        <p className="text-slate-600 dark:text-slate-300 font-medium mt-1">{product.weight}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
            ৳<span className="ml-1">{product.price}</span>
          </p>
           {product.rating > 0 && (
            <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{product.rating.toFixed(1)}</span>
            </div>
           )}
        </div>
      </div>
      <div className="p-4 bg-black/5 dark:bg-black/10 mt-auto text-center font-bold text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
        Shop Now
      </div>
    </Link>
  );
};

export default React.memo(ProductCard);