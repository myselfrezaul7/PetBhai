import React, { useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { BANGLADESH_DISTRICTS } from '../constants';

type ServiceTab = 'Vets' | 'Groomers' | 'Trainers' | 'Sitters';

// Tab options for consistency
const SERVICE_TABS: ServiceTab[] = ['Vets', 'Groomers', 'Trainers', 'Sitters'];

const SERVICE_PREVIEWS: Record<ServiceTab, Array<{ title: string; subtitle: string; icon: string }>> = {
  Vets: [
    { title: 'Home Consultation', subtitle: 'Doctor visits your home in Dhaka zones', icon: '🩺' },
    { title: 'Video Vet Session', subtitle: 'Quick telehealth follow-up for mild issues', icon: '📹' },
    { title: 'Emergency Support', subtitle: 'Priority queue for urgent requests', icon: '🚑' },
  ],
  Groomers: [
    { title: 'At-Home Grooming', subtitle: 'Bath, trim, and hygiene care at your doorstep', icon: '✂️' },
    { title: 'Spa & Coat Care', subtitle: 'Skin-safe treatment for sensitive pets', icon: '🫧' },
    { title: 'Nail & Ear Care', subtitle: 'Quick maintenance appointments', icon: '🐾' },
  ],
  Trainers: [
    { title: 'Puppy Basics', subtitle: 'Leash, potty, and social behavior training', icon: '🎯' },
    { title: 'Behavior Reset', subtitle: 'Targeted plans for barking and anxiety', icon: '🧠' },
    { title: 'Obedience Program', subtitle: 'Structured 4-week guided sessions', icon: '🏅' },
  ],
  Sitters: [
    { title: 'Drop-In Sitting', subtitle: 'Daily check-ins and meal support', icon: '🏠' },
    { title: 'Overnight Care', subtitle: 'Trusted pet companion through the night', icon: '🌙' },
    { title: 'Walk & Play', subtitle: 'Walk sessions for active dogs', icon: '🐕' },
  ],
};

// Memoized tab button component
const TabButton = memo<{ label: ServiceTab; isActive: boolean; onClick: () => void }>(
  ({ label, isActive, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 sm:py-3 font-bold text-sm sm:text-lg rounded-t-lg transition-all duration-200 border-b-4 whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          isActive
            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500/30'
        }`}
      >
        {label}
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

  const servicePreview = SERVICE_PREVIEWS[activeTab];

  return (
    <main className="container mx-auto px-3 pb-28 pt-8 md:px-6 md:py-16">
      <header className="text-center mb-8 md:mb-12 glass-card-ios border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl p-5 md:p-8">
        <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/10 px-3 py-1 text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-300 mb-3">
          Trusted Professionals
        </span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white">
          Professional Pet Services
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 max-w-3xl mx-auto mt-3 md:mt-4 px-2">
          Find and book trusted local professionals for every pet need.
        </p>
      </header>

      {/* Tabs & Filters */}
      <div className="glass-card-ios p-3 sm:p-4 mb-8 md:mb-12 border border-white/35 dark:border-white/10 bg-white/45 dark:bg-slate-900/35 backdrop-blur-xl shadow-xl">
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

      <section className="space-y-3">
        {servicePreview.map((service) => (
          <article
            key={service.title}
            className="glass-card-ios rounded-2xl border border-white/35 bg-white/55 p-4 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl dark:bg-slate-800/75">
                <span aria-hidden="true">{service.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{service.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{service.subtitle}</p>
              </div>
              <Link
                to="/services/booking"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition-colors hover:bg-orange-600"
                aria-label={`Request ${service.title}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* Specialized Services CTA */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
          Looking for something else?
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/services/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-bold shadow-lg hover:shadow-orange-500/30 hover:scale-105 transition-all"
          >
            <span>🚚 Pet Taxi & Transport</span>
          </Link>
          <Link
            to="/services/booking"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white font-bold shadow-lg hover:shadow-pink-500/30 hover:scale-105 transition-all"
          >
            <span>📸 Pet Photography</span>
          </Link>
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/65 bg-white/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 md:hidden">
        <Link
          to="/services/booking"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg"
        >
          Request {activeTab} Service
        </Link>
      </div>
    </main>
  );
};

export default ServicesPage;
