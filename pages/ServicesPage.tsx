import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { BANGLADESH_DISTRICTS } from '../constants';

type ServiceTab = 'Vets' | 'Groomers' | 'Trainers' | 'Sitters';

// Tab options for consistency
const SERVICE_TABS: ServiceTab[] = ['Vets', 'Groomers', 'Trainers', 'Sitters'];

// Memoized tab button component
const TabButton = memo<{ label: ServiceTab; isActive: boolean; onClick: () => void }>(
  ({ label, isActive, onClick }) => {
    const labelContent =
      label === 'Vets' ? (
        <span className="flex items-center gap-2">
          <span>{label}</span>
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
            Coming Soon
          </span>
        </span>
      ) : (
        label
      );

    return (
      <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 sm:py-3 font-bold text-sm sm:text-lg rounded-t-lg transition-all duration-200 border-b-4 whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          isActive
            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500/30'
        }`}
      >
        {labelContent}
      </button>
    );
  }
);

TabButton.displayName = 'TabButton';

const ServicesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ServiceTab>('Vets');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Memoized handlers
  const handleTabChange = useCallback((tab: ServiceTab) => {
    setActiveTab(tab);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
  }, []);

  // All services are currently in "Coming Soon" state
  const isComingSoon = true;

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
      <div className="glass-card-ios p-3 sm:p-4 mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="border-b border-slate-300/50 dark:border-slate-600/50 w-full overflow-x-auto scrollbar-hide">
            <div
              className="flex space-x-1 sm:space-x-2 min-w-max pb-px"
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
            </div>
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

      {isComingSoon && (
        <div className="text-center py-16 glass-card-ios">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4">
            Coming Soon!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
            We're working hard to bring you the best {activeTab.toLowerCase()} in Bangladesh. Stay
            tuned!
          </p>
        </div>
      )}

      {/* Specialized Services CTA */}
      <div className="mt-16 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
          Looking for something else?
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/services/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-bold shadow-lg hover:shadow-orange-500/25 hover:scale-105 transition-all"
          >
            <span>🚚 Pet Taxi & Transport</span>
          </Link>
          <Link
            to="/services/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white font-bold shadow-lg hover:shadow-pink-500/25 hover:scale-105 transition-all"
          >
            <span>📸 Pet Photography</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
