import React, { useState, useMemo } from 'react';
import AnimalCard from '../components/AnimalCard';
import { MOCK_ANIMALS } from '../constants';
import type { AnimalAge, AnimalStatus } from '../types';

type AnimalTypeFilter = 'All' | 'Dog' | 'Cat';
type GenderFilter = 'All' | 'Male' | 'Female';
type AgeFilter = 'All' | AnimalAge;
type StatusFilter = 'All' | AnimalStatus;


const AdoptPage: React.FC = () => {
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalTypeFilter>('All');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Available');

  const filteredAnimals = useMemo(() => {
    return MOCK_ANIMALS.filter(animal => {
      const typeMatch =
        animalTypeFilter === 'All' ||
        (animalTypeFilter === 'Dog' && (animal.breed.toLowerCase().includes('dog') || animal.breed.toLowerCase().includes('retriever') || animal.breed.toLowerCase().includes('shepherd') || animal.breed.toLowerCase().includes('beagle') || animal.breed.toLowerCase().includes('labrador'))) ||
        (animalTypeFilter === 'Cat' && (animal.breed.toLowerCase().includes('cat') || animal.breed.toLowerCase().includes('shorthair') || animal.breed.toLowerCase().includes('siamese')));
      
      const genderMatch = genderFilter === 'All' || animal.gender === genderFilter;
      const ageMatch = ageFilter === 'All' || animal.age === ageFilter;
      const statusMatch = statusFilter === 'All' || animal.status === statusFilter;


      return typeMatch && genderMatch && ageMatch && statusMatch;
    });
  }, [animalTypeFilter, genderFilter, ageFilter, statusFilter]);

  const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm whitespace-nowrap ${
        isActive
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 hover:bg-orange-100/50 dark:hover:bg-slate-600/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 animate-fade-in">
      <div className="glass-card p-6 md:p-8 mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-slate-800 dark:text-white mb-4">Find Your New Best Friend</h1>
        <p className="text-base md:text-lg text-center text-slate-700 dark:text-slate-200 max-w-3xl mx-auto">
            These wonderful animals are waiting for a loving family to call their own. Use the filters to find the perfect match for you.
        </p>
      </div>
      

      {/* Filters Section */}
      <div className="glass-card p-4 md:p-6 mb-8 md:mb-16 overflow-x-auto">
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-max md:min-w-0">
              {/* Species Filter */}
              <div className="flex flex-col space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Species</label>
                  <div className="flex flex-wrap items-center gap-2">
                      <FilterButton label="All" isActive={animalTypeFilter === 'All'} onClick={() => setAnimalTypeFilter('All')} />
                      <FilterButton label="Dogs" isActive={animalTypeFilter === 'Dog'} onClick={() => setAnimalTypeFilter('Dog')} />
                      <FilterButton label="Cats" isActive={animalTypeFilter === 'Cat'} onClick={() => setAnimalTypeFilter('Cat')} />
                  </div>
              </div>

              {/* Gender Filter */}
              <div className="flex flex-col space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Gender</label>
                  <div className="flex flex-wrap items-center gap-2">
                      <FilterButton label="Any" isActive={genderFilter === 'All'} onClick={() => setGenderFilter('All')} />
                      <FilterButton label="Male" isActive={genderFilter === 'Male'} onClick={() => setGenderFilter('Male')} />
                      <FilterButton label="Female" isActive={genderFilter === 'Female'} onClick={() => setGenderFilter('Female')} />
                  </div>
              </div>

              {/* Age Filter */}
              <div className="flex flex-col space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Age</label>
                  <div className="flex flex-wrap items-center gap-2">
                      <FilterButton label="Any" isActive={ageFilter === 'All'} onClick={() => setAgeFilter('All')} />
                      <FilterButton label="Puppy/Kitten" isActive={ageFilter === 'Puppy/Kitten'} onClick={() => setAgeFilter('Puppy/Kitten')} />
                      <FilterButton label="Young" isActive={ageFilter === 'Young'} onClick={() => setAgeFilter('Young')} />
                      <FilterButton label="Adult" isActive={ageFilter === 'Adult'} onClick={() => setAgeFilter('Adult')} />
                      <FilterButton label="Senior" isActive={ageFilter === 'Senior'} onClick={() => setAgeFilter('Senior')} />
                  </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-200">Status</label>
                  <div className="flex flex-wrap items-center gap-2">
                      <FilterButton label="Available" isActive={statusFilter === 'Available'} onClick={() => setStatusFilter('Available')} />
                      <FilterButton label="Pending" isActive={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')} />
                      <FilterButton label="Adopted" isActive={statusFilter === 'Adopted'} onClick={() => setStatusFilter('Adopted')} />
                      <FilterButton label="All" isActive={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
                  </div>
              </div>
          </div>
      </div>

      {filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
          {filteredAnimals.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
         <div className="text-center py-10 glass-card">
            <p className="text-xl text-slate-700 dark:text-slate-200">No animals match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default AdoptPage;