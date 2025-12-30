import React, { useState, useMemo, useCallback, memo } from 'react';
import { MOCK_GROOMERS, MOCK_TRAINERS, MOCK_PET_SITTERS, BANGLADESH_DISTRICTS } from '../constants';
import { useVets } from '../contexts/VetContext';
import VetCard from '../components/VetCard';
import ServiceCard from '../components/ServiceCard';
import type { Vet, Groomer, Trainer, PetSitter } from '../types';
import { PawIcon } from '../components/icons';

type ServiceTab = 'Vets' | 'Groomers' | 'Trainers' | 'Sitters';

// Tab options for consistency
const SERVICE_TABS: ServiceTab[] = ['Vets', 'Groomers', 'Trainers', 'Sitters'];

// Memoized tab button component
const TabButton = memo<{ label: ServiceTab; isActive: boolean; onClick: () => void }>(
  ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 sm:py-3 font-bold text-sm sm:text-lg rounded-t-lg transition-all duration-200 border-b-4 whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        isActive
          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500/30'
      }`}
      aria-selected={isActive ? 'true' : 'false'}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-controls={`${label.toLowerCase()}-panel`}
    >
      {label}
    </button>
  )
);

TabButton.displayName = 'TabButton';

const ServicesPage: React.FC = () => {
  const { vets, loading: vetsLoading, error: vetsError } = useVets();
  const [activeTab, setActiveTab] = useState<ServiceTab>('Vets');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Memoized handlers
  const handleTabChange = useCallback((tab: ServiceTab) => {
    setActiveTab(tab);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
  }, []);

  const handleClearFilter = useCallback(() => {
    setLocationFilter('All');
  }, []);

  const professionals = useMemo(() => {
    let list: (Vet | Groomer | Trainer | PetSitter)[] = [];
    switch (activeTab) {
      case 'Vets':
        list = vets;
        break;
      case 'Groomers':
        list = MOCK_GROOMERS;
        break;
      case 'Trainers':
        list = MOCK_TRAINERS;
        break;
      case 'Sitters':
        list = MOCK_PET_SITTERS;
        break;
    }
    if (locationFilter === 'All') {
      return list;
    }
    return list.filter((p) =>
      'address' in p ? p.address.includes(locationFilter) : p.location === locationFilter
    );
  }, [activeTab, locationFilter, vets]);

  // Count results for accessibility
  const resultCount = professionals.length;

  return (
    <div className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white">
          Professional Pet Services
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mt-3 md:mt-4 px-2">
          Find and book trusted local professionals for every pet need.
        </p>
      </header>

      {/* Tabs & Filters */}
      <div className="glass-card p-3 sm:p-4 mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="border-b border-slate-300/50 dark:border-slate-600/50 w-full overflow-x-auto scrollbar-hide">
            <nav
              className="flex space-x-1 sm:space-x-2 min-w-max pb-px"
              role="tablist"
              aria-label="Service categories"
            >
              {SERVICE_TABS.map((tab) => (
                <TabButton
                  key={tab}
                  label={tab}
                  isActive={activeTab === tab}
                  onClick={() => handleTabChange(tab)}
                />
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <label
              htmlFor="location-filter"
              className="font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline text-sm"
            >
              Location:
            </label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={handleLocationChange}
              className="w-full sm:w-auto p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-700/50 focus:ring-orange-500 focus:outline-none focus:ring-2 cursor-pointer touch-manipulation"
            >
              <option value="All">All Bangladesh</option>
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!vetsLoading && `${resultCount} ${activeTab.toLowerCase()} found`}
      </div>

      {activeTab === 'Vets' && vetsLoading ? (
        <div
          className="flex justify-center items-center h-64"
          role="status"
          aria-label="Loading veterinarians"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
          <PawIcon className="absolute w-6 h-6 text-orange-500 animate-pulse" aria-hidden="true" />
          <span className="sr-only">Loading...</span>
        </div>
      ) : activeTab === 'Vets' && vetsError ? (
        <div className="text-center py-12" role="alert">
          <p className="text-red-500 mb-4">{vetsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
          >
            Try Again
          </button>
        </div>
      ) : resultCount > 0 ? (
        <section
          id={`${activeTab.toLowerCase()}-panel`}
          role="tabpanel"
          aria-label={`${activeTab} listings`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {professionals.map((p) => {
              if ('specialization' in p) {
                // It's a Vet
                return <VetCard key={`vet-${p.id}`} vet={p} />;
              }
              // It's a Groomer, Trainer, or Sitter
              return <ServiceCard key={`${p.category}-${p.id}`} professional={p} />;
            })}
          </div>
        </section>
      ) : (
        <div className="text-center py-10 glass-card">
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-4">
            No {activeTab.toLowerCase()} found for "{locationFilter}".
          </p>
          {locationFilter !== 'All' && (
            <button
              onClick={handleClearFilter}
              className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
