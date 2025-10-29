import React, { useState, useMemo } from 'react';
import AnimalCard from '../components/AnimalCard';
import { MOCK_ANIMALS } from '../constants';
import type { Animal } from '../types';

type AnimalTypeFilter = 'All' | 'Dog' | 'Cat';
type GenderFilter = 'All' | 'Male' | 'Female';

const AdoptPage: React.FC = () => {
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalTypeFilter>('All');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');

  const filteredAnimals = useMemo(() => {
    return MOCK_ANIMALS.filter(animal => {
      const typeMatch =
        animalTypeFilter === 'All' ||
        (animalTypeFilter === 'Dog' && (animal.breed.toLowerCase().includes('dog') || animal.breed.toLowerCase().includes('retriever') || animal.breed.toLowerCase().includes('shepherd') || animal.breed.toLowerCase().includes('beagle') || animal.breed.toLowerCase().includes('labrador'))) ||
        (animalTypeFilter === 'Cat' && (animal.breed.toLowerCase().includes('cat') || animal.breed.toLowerCase().includes('shorthair') || animal.breed.toLowerCase().includes('siamese')));
      
      const genderMatch = genderFilter === 'All' || animal.gender === genderFilter;

      return typeMatch && genderMatch;
    });
  }, [animalTypeFilter, genderFilter]);

  const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full font-semibold transition-colors text-base whitespace-nowrap ${
        isActive
          ? 'bg-orange-500 text-white shadow-md'
          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-6 py-16 animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-slate-800 dark:text-white mb-4">Find Your New Best Friend</h1>
      <p className="text-lg text-center text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12">
        These wonderful animals are waiting for a loving family to call their own. Use the filters to find the perfect match for you.
      </p>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16">
        <div className="flex items-center flex-wrap justify-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
            <FilterButton label="All Pets" isActive={animalTypeFilter === 'All'} onClick={() => setAnimalTypeFilter('All')} />
            <FilterButton label="Dogs" isActive={animalTypeFilter === 'Dog'} onClick={() => setAnimalTypeFilter('Dog')} />
            <FilterButton label="Cats" isActive={animalTypeFilter === 'Cat'} onClick={() => setAnimalTypeFilter('Cat')} />
        </div>
         <div className="flex items-center flex-wrap justify-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
            <FilterButton label="Any Gender" isActive={genderFilter === 'All'} onClick={() => setGenderFilter('All')} />
            <FilterButton label="Male" isActive={genderFilter === 'Male'} onClick={() => setGenderFilter('Male')} />
            <FilterButton label="Female" isActive={genderFilter === 'Female'} onClick={() => setGenderFilter('Female')} />
        </div>
      </div>

      {filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredAnimals.map(animal => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
         <div className="text-center py-10">
            <p className="text-xl text-slate-600 dark:text-slate-300">No animals match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default AdoptPage;
