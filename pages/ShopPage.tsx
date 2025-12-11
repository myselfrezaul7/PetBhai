import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { MOCK_BRANDS } from '../constants';
import { SearchIcon } from '../components/icons';
import type { Product } from '../types';
import { useProducts } from '../contexts/ProductContext';
import ProductQuickViewModal from '../components/ProductQuickViewModal';

type CategoryFilter = 'All' | 'Dog Food' | 'Cat Food' | 'Dog Supplies' | 'Cat Supplies' | 'Grooming';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';

const ShopPage: React.FC = () => {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [activeBrand, setActiveBrand] = useState<string>(location.state?.brand || 'All');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products: allProducts } = useProducts();

  const sortedAndFilteredProducts = useMemo(() => {
    let products: Product[] = [...allProducts];

    // 1. Filter by search query
    if (searchQuery.trim() !== '') {
        const lowerCaseQuery = searchQuery.toLowerCase();
        products = products.filter(p => {
             const nameMatch = p.name.toLowerCase().includes(lowerCaseQuery);
             const categoryMatch = p.category.toLowerCase().includes(lowerCaseQuery);
             const tagMatch = p.searchTags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
             return nameMatch || categoryMatch || tagMatch;
        });
    }

    // 2. Filter by category
    if (activeCategory !== 'All') {
      products = products.filter(p => p.category === activeCategory);
    }

    // 3. Filter by brand
    if (activeBrand !== 'All') {
        const brand = MOCK_BRANDS.find(b => b.name === activeBrand);
        if(brand) {
            products = products.filter(p => p.brandId === brand.id);
        }
    }

    // 4. Sort
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
  }, [activeCategory, activeBrand, sortOption, searchQuery, allProducts]);

  const CategoryFilterButton: React.FC<{ filter: CategoryFilter }> = ({ filter }) => (
    <button
      onClick={() => setActiveCategory(filter)}
      className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 text-sm whitespace-nowrap active:scale-95 ${
        activeCategory === filter
          ? 'bg-orange-500 text-white shadow-lg transform scale-105'
          : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
      }`}
    >
      {filter}
    </button>
  );

  return (
    <>
      <div className="container mx-auto px-3 md:px-6 py-12 md:py-16 animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-slate-800 dark:text-white mb-4">Shop For Your Buddy</h1>
        <p className="text-base md:text-lg text-center text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10">
          Find everything you need to keep your pet happy and healthy, from premium food to fun toys.
        </p>
        
        {/* Filters & Sorting */}
        <div className="glass-card p-6 mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm focus:shadow-md"
                    aria-label="Search products"
                />
            </div>

             <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <CategoryFilterButton filter="All" />
                <CategoryFilterButton filter="Dog Food" />
                <CategoryFilterButton filter="Cat Food" />
                <CategoryFilterButton filter="Dog Supplies" />
                <CategoryFilterButton filter="Cat Supplies" />
                <CategoryFilterButton filter="Grooming" />
            </div>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <label htmlFor="brand-filter" className="font-semibold text-slate-700 dark:text-slate-200">Brand:</label>
                    <div className="relative">
                        <select id="brand-filter" value={activeBrand} onChange={e => setActiveBrand(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500 cursor-pointer">
                            <option value="All">All Brands</option>
                            {MOCK_BRANDS.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="sort-by" className="font-semibold text-slate-700 dark:text-slate-200">Sort by:</label>
                    <div className="relative">
                        <select id="sort-by" value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500 cursor-pointer">
                            <option value="default">Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating-desc">Highest Rated</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2 columns on mobile, 3 on md, 4 on xl. Gap 3 for mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
          {sortedAndFilteredProducts.map(product => (
            <ProductCard 
                key={product.id} 
                product={product} 
                onQuickView={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      </div>
      
      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickViewModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
        />
      )}
    </>
  );
};

export default ShopPage;