import React, { useState, useMemo, useCallback, memo } from 'react';
import AnimalCard from '../components/AnimalCard';
import { useAnimals } from '../contexts/AnimalContext';
import type { AnimalAge, AnimalStatus } from '../types';
import { PawIcon } from '../components/icons';

type AnimalTypeFilter = 'All' | 'Dog' | 'Cat';
type GenderFilter = 'All' | 'Male' | 'Female';
type AgeFilter = 'All' | AnimalAge;
type StatusFilter = 'All' | AnimalStatus;

// Memoized filter button component for better performance
const FilterButton = memo<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  ariaLabel?: string;
}>(({ label, isActive, onClick, ariaLabel }) => (
  <button
    onClick={onClick}
    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold transition-all duration-200 text-xs sm:text-sm whitespace-nowrap touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
      isActive
        ? 'bg-orange-500 text-white shadow-md'
        : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
    }`}
    aria-pressed={isActive}
    aria-label={ariaLabel || `Filter by ${label}`}
  >
    {label}
  </button>
));

FilterButton.displayName = 'FilterButton';

const AdoptPage: React.FC = () => {
  const { animals, loading, error } = useAnimals();
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalTypeFilter>('All');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Available');

  // Memoized filter handlers
  const handleAnimalTypeChange = useCallback((type: AnimalTypeFilter) => {
    setAnimalTypeFilter(type);
  }, []);

  const handleGenderChange = useCallback((gender: GenderFilter) => {
    setGenderFilter(gender);
  }, []);

  const handleAgeChange = useCallback((age: AgeFilter) => {
    setAgeFilter(age);
  }, []);

  const handleStatusChange = useCallback((status: StatusFilter) => {
    setStatusFilter(status);
  }, []);

  const handleClearFilters = useCallback(() => {
    setAnimalTypeFilter('All');
    setGenderFilter('All');
    setAgeFilter('All');
    setStatusFilter('Available');
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const typeMatch =
        animalTypeFilter === 'All' ||
        (animalTypeFilter === 'Dog' &&
          (animal.breed.toLowerCase().includes('dog') ||
            animal.breed.toLowerCase().includes('retriever') ||
            animal.breed.toLowerCase().includes('shepherd') ||
            animal.breed.toLowerCase().includes('beagle') ||
            animal.breed.toLowerCase().includes('labrador'))) ||
        (animalTypeFilter === 'Cat' &&
          (animal.breed.toLowerCase().includes('cat') ||
            animal.breed.toLowerCase().includes('shorthair') ||
            animal.breed.toLowerCase().includes('siamese')));

      const genderMatch = genderFilter === 'All' || animal.gender === genderFilter;
      const ageMatch = ageFilter === 'All' || animal.age === ageFilter;
      const statusMatch = statusFilter === 'All' || animal.status === statusFilter;

      return typeMatch && genderMatch && ageMatch && statusMatch;
    });
  }, [animalTypeFilter, genderFilter, ageFilter, statusFilter, animals]);

  // Calculate result count for accessibility
  const resultCount = filteredAnimals.length;

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-96"
        role="status"
        aria-label="Loading animals"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <PawIcon className="absolute w-8 h-8 text-orange-500 animate-pulse" aria-hidden="true" />
        <span className="sr-only">Loading animals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-16 text-center" role="alert">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Animals</h2>
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-3 md:px-6 py-8 md:py-16 animate-fade-in">
      <header className="glass-card p-4 sm:p-6 md:p-8 mb-6 md:mb-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-800 dark:text-white mb-3 md:mb-4">
          Find Your New Best Friend
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 max-w-3xl mx-auto px-2">
          These wonderful animals are waiting for a loving family to call their own. Use the filters
          to find the perfect match for you.
        </p>
      </header>

      {/* Filters Section */}
      <div className="glass-card p-3 sm:p-4 md:p-6 mb-6 md:mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Species Filter */}
          <fieldset className="flex flex-col space-y-2">
            <legend className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              Species
            </legend>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group">
              <FilterButton
                label="All"
                isActive={animalTypeFilter === 'All'}
                onClick={() => handleAnimalTypeChange('All')}
              />
              <FilterButton
                label="Dogs"
                isActive={animalTypeFilter === 'Dog'}
                onClick={() => handleAnimalTypeChange('Dog')}
              />
              <FilterButton
                label="Cats"
                isActive={animalTypeFilter === 'Cat'}
                onClick={() => handleAnimalTypeChange('Cat')}
              />
            </div>
          </fieldset>

          {/* Gender Filter */}
          <fieldset className="flex flex-col space-y-2">
            <legend className="font-bold text-slate-700 dark:text-slate-200 text-sm">Gender</legend>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group">
              <FilterButton
                label="Any"
                isActive={genderFilter === 'All'}
                onClick={() => handleGenderChange('All')}
              />
              <FilterButton
                label="Male"
                isActive={genderFilter === 'Male'}
                onClick={() => handleGenderChange('Male')}
              />
              <FilterButton
                label="Female"
                isActive={genderFilter === 'Female'}
                onClick={() => handleGenderChange('Female')}
              />
            </div>
          </fieldset>

          {/* Age Filter */}
          <fieldset className="flex flex-col space-y-2">
            <legend className="font-bold text-slate-700 dark:text-slate-200 text-sm">Age</legend>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group">
              <FilterButton
                label="Any"
                isActive={ageFilter === 'All'}
                onClick={() => handleAgeChange('All')}
              />
              <FilterButton
                label="Puppy/Kitten"
                isActive={ageFilter === 'Puppy/Kitten'}
                onClick={() => handleAgeChange('Puppy/Kitten')}
              />
              <FilterButton
                label="Young"
                isActive={ageFilter === 'Young'}
                onClick={() => handleAgeChange('Young')}
              />
              <FilterButton
                label="Adult"
                isActive={ageFilter === 'Adult'}
                onClick={() => handleAgeChange('Adult')}
              />
              <FilterButton
                label="Senior"
                isActive={ageFilter === 'Senior'}
                onClick={() => handleAgeChange('Senior')}
              />
            </div>
          </fieldset>

          {/* Status Filter */}
          <fieldset className="flex flex-col space-y-2">
            <legend className="font-bold text-slate-700 dark:text-slate-200 text-sm">Status</legend>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="group">
              <FilterButton
                label="Available"
                isActive={statusFilter === 'Available'}
                onClick={() => handleStatusChange('Available')}
              />
              <FilterButton
                label="Pending"
                isActive={statusFilter === 'Pending'}
                onClick={() => handleStatusChange('Pending')}
              />
              <FilterButton
                label="Adopted"
                isActive={statusFilter === 'Adopted'}
                onClick={() => handleStatusChange('Adopted')}
              />
              <FilterButton
                label="All"
                isActive={statusFilter === 'All'}
                onClick={() => handleStatusChange('All')}
              />
            </div>
          </fieldset>
        </div>
      </div>

      {/* Screen reader announcement for results */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`${resultCount} animals found`}
      </div>

      {resultCount > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-8">
          {filteredAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 glass-card">
          <p className="text-xl text-slate-700 dark:text-slate-200 mb-4">
            No animals match your current filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
          >
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );
};

export default AdoptPage;
