import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import { MOCK_PRODUCTS, MOCK_BRANDS } from '../constants';
import { useCart } from '../contexts/CartContext';
import { ShoppingCartIcon } from '../components/icons';
import type { Product } from '../types';

type CategoryFilter = 'All' | 'Dog Food' | 'Cat Food' | 'Dog Supplies' | 'Cat Supplies' | 'Grooming';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';

const ShopPage: React.FC = () => {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [activeBrand, setActiveBrand] = useState<string>(location.state?.brand || 'All');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();

  const sortedAndFilteredProducts = useMemo(() => {
    let products: Product[] = [...MOCK_PRODUCTS];

    // Filter by category
    if (activeCategory !== 'All') {
      products = products.filter(p => p.category === activeCategory);
    }

    // Filter by brand
    if (activeBrand !== 'All') {
        const brand = MOCK_BRANDS.find(b => b.name === activeBrand);
        if(brand) {
            products = products.filter(p => p.brandId === brand.id);
        }
    }

    // Sort
    switch(sortOption) {
        case 'price-asc':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'rating-desc':
            products.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Default sort (e.g., by ID or as is)
            break;
    }

    return products;
  }, [activeCategory, activeBrand, sortOption]);

  const CategoryFilterButton: React.FC<{ filter: CategoryFilter }> = ({ filter }) => (
    <button
      onClick={() => setActiveCategory(filter)}
      className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm whitespace-nowrap ${
        activeCategory === filter
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
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
          Find everything you need to keep your pet happy and healthy, from premium food to fun toys.
        </p>
        
        {/* Filters & Sorting */}
        <div className="glass-card p-4 mb-12 space-y-4">
             <div className="flex flex-wrap items-center justify-center gap-2">
                <CategoryFilterButton filter="All" />
                <CategoryFilterButton filter="Dog Food" />
                <CategoryFilterButton filter="Cat Food" />
                <CategoryFilterButton filter="Dog Supplies" />
                <CategoryFilterButton filter="Cat Supplies" />
                <CategoryFilterButton filter="Grooming" />
            </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-white/20 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <label htmlFor="brand-filter" className="font-semibold text-slate-700 dark:text-slate-200">Brand:</label>
                    <select id="brand-filter" value={activeBrand} onChange={e => setActiveBrand(e.target.value)} className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500">
                        <option value="All">All Brands</option>
                        {MOCK_BRANDS.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="sort-by" className="font-semibold text-slate-700 dark:text-slate-200">Sort by:</label>
                    <select id="sort-by" value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500">
                        <option value="default">Default</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Highest Rated</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {sortedAndFilteredProducts.map(product => (
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