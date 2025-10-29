import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import { MOCK_PRODUCTS } from '../constants';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon } from '../components/icons';

type FilterType = 'All' | 'Dog Food' | 'Cat Food' | 'Dog Supplies' | 'Cat Supplies' | 'Grooming';

const ShopPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    if (activeFilter === 'All') return true;
    return product.category === activeFilter;
  });

  const FilterButton: React.FC<{ filter: FilterType }> = ({ filter }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-5 py-2 rounded-full font-semibold transition-colors text-base whitespace-nowrap ${
        activeFilter === filter
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-600'
      }`}
    >
      {filter}
    </button>
  );

  return (
    <>
      <div className="container mx-auto px-6 py-16 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-slate-800 dark:text-white mb-4">Shop For Your Buddy</h1>
        <p className="text-lg text-center text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10">
          All proceeds from our shop go directly towards funding our rescue and rehabilitation efforts.
        </p>

        <div className="flex justify-center items-center flex-wrap gap-3 md:gap-4 mb-16 bg-slate-100 dark:bg-slate-800 p-3 rounded-full max-w-2xl mx-auto">
          <FilterButton filter="All" />
          <FilterButton filter="Dog Food" />
          <FilterButton filter="Cat Food" />
          <FilterButton filter="Dog Supplies" />
          <FilterButton filter="Cat Supplies" />
          <FilterButton filter="Grooming" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-24 right-5 w-16 h-16 bg-orange-500 rounded-full text-white shadow-xl z-30 flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-300"
        aria-label={`Open shopping cart with ${cartCount} items`}
      >
        <ShoppingCartIcon className="w-8 h-8" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default ShopPage;
