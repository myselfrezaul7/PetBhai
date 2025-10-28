import React from 'react';
import { Link } from 'react-router-dom';
import type { Animal, Product } from '../types';
import { SearchIcon } from './icons';

interface PageResult {
  name: string;
  path: string;
}

export interface SearchResultsData {
  pets: Animal[];
  products: Product[];
  pages: PageResult[];
}

interface SearchResultsProps {
  query: string;
  results: SearchResultsData;
  loading: boolean;
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, results, loading, onClose }) => {
  const hasResults = results.pets.length > 0 || results.products.length > 0 || results.pages.length > 0;

  return (
    <div className="absolute top-full mt-2 w-full md:w-[450px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-30 overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 animate-pulse">Searching...</div>
        ) : query && !hasResults ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <p className="font-semibold">No results found for "{query}"</p>
            <p className="text-sm mt-1">Try searching for something else.</p>
          </div>
        ) : (
          <div>
            {/* Pets Results */}
            {results.pets.length > 0 && (
              <div className="p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Pets for Adoption</h3>
                <ul>
                  {results.pets.map(pet => (
                    <li key={`pet-${pet.id}`}>
                      <Link to={`/adopt/${pet.id}`} onClick={onClose} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <img src={pet.imageUrl} alt={pet.name} className="w-12 h-12 object-cover rounded-md" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{pet.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{pet.breed}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Products Results */}
            {results.products.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Shop Products</h3>
                <ul>
                  {results.products.map(product => (
                    <li key={`product-${product.id}`}>
                      <Link to="/shop" onClick={onClose} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{product.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">৳{product.price}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Pages Results */}
            {results.pages.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 px-2">Pages</h3>
                     <ul>
                        {results.pages.map(page => (
                            <li key={`page-${page.path}`}>
                                <Link to={page.path} onClick={onClose} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md">
                                        <SearchIcon className="w-6 h-6 text-slate-500"/>
                                    </div>
                                    <p className="font-semibold text-slate-800 dark:text-white">{page.name}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;