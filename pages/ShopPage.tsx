import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import { MOCK_PRODUCTS } from '../constants';

type FilterType = 'All' | 'Dog Food' | 'Cat Food';

const ShopPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    if (activeFilter === 'All') return true;
    return product.category === activeFilter;
  });

  const FilterButton: React.FC<{ filter: FilterType }> = ({ filter }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-6 py-2 rounded-full font-semibold transition-colors text-lg ${
        activeFilter === filter
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white text-slate-600 hover:bg-orange-100'
      }`}
    >
      {filter}
    </button>
  );

  return (
    <div className="container mx-auto px-6 py-16">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-slate-800 mb-4">Shop For Your Buddy</h1>
      <p className="text-lg text-center text-slate-600 max-w-3xl mx-auto mb-10">
        All proceeds from our shop go directly towards funding our rescue and rehabilitation efforts.
      </p>

      <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-16 bg-slate-100 p-2 rounded-full max-w-md mx-auto">
        <FilterButton filter="All" />
        <FilterButton filter="Dog Food" />
        <FilterButton filter="Cat Food" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
