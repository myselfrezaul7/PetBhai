import React from 'react';
import type { Product } from '../types';
import { ShoppingCartIcon } from './icons';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col group transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
      <div className="relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" />
        <div className="absolute top-3 right-3 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
          {product.category}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-800 flex-grow">{product.name}</h3>
        <p className="text-slate-500 font-medium mt-1">{product.weight}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-2xl font-extrabold text-slate-900">
            ৳<span className="ml-1">{product.price}</span>
          </p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
        <button className="w-full flex items-center justify-center space-x-2 bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300">
            <ShoppingCartIcon className="w-5 h-5" />
            <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
