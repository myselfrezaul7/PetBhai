import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnimals } from '../contexts/AnimalContext';
import AdoptionForm from '../components/AdoptionForm';
import { HeartIcon, PawIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AnimalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { animals, loading, error } = useAnimals();
  const animal = useMemo(() => animals.find((a) => a.id === Number(id)), [id, animals]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { isAuthenticated, currentUser, favoritePet, unfavoritePet } = useAuth();
  const toast = useToast();

  const isFavorited = useMemo(() => {
    return currentUser?.favorites.includes(animal?.id ?? -1) ?? false;
  }, [currentUser, animal]);

  const handleFavoriteClick = useCallback(() => {
    if (!isAuthenticated || !animal) {
      toast.info('Please log in to favorite pets.');
      return;
    }
    if (isFavorited) {
      unfavoritePet(animal.id);
    } else {
      favoritePet(animal.id);
    }
  }, [isAuthenticated, animal, isFavorited, toast, unfavoritePet, favoritePet]);

  const handleOpenForm = useCallback(() => setIsFormOpen(true), []);
  const handleCloseForm = useCallback(() => setIsFormOpen(false), []);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-96"
        role="status"
        aria-label="Loading animal"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <PawIcon className="absolute w-8 h-8 text-orange-500 animate-pulse" aria-hidden="true" />
        <span className="sr-only">Loading animal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Error Loading Animal</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{error}</p>
      </main>
    );
  }

  if (!animal) {
    return (
      <main className="text-center py-16 sm:py-20 animate-fade-in container mx-auto px-4 sm:px-6">
        <div className="glass-card p-8 sm:p-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            Animal not found!
          </h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mt-4">
            The animal you are looking for might have been adopted or the link is incorrect.
          </p>
          <Link
            to="/adopt"
            className="mt-8 inline-block bg-orange-500 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
          >
            Back to Adoption Page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <article className="glass-card overflow-hidden md:flex">
        <figure className="md:w-1/2">
          <img
            src={animal.imageUrl}
            alt={animal.name}
            className="w-full h-full object-cover min-h-[300px]"
            loading="lazy"
          />
        </figure>
        <div className="p-6 sm:p-8 md:p-12 md:w-1/2 flex flex-col justify-between">
          <header>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white">
              {animal.name}
            </h1>
            <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-200 font-semibold mt-2">
              {animal.breed}
            </p>
            <div className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2">
              <span>{animal.age}</span>
              <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                &bull;
              </span>
              <span>{animal.gender}</span>
              <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                &bull;
              </span>
              <span>{animal.size}</span>
              <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                &bull;
              </span>
              <span
                className={`px-2 py-0.5 text-xs sm:text-sm rounded-full ${animal.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {animal.status}
              </span>
            </div>
          </header>
          <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-300 mt-6 leading-relaxed">
            {animal.description}
          </p>
          <div className="mt-6 sm:mt-8 flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleOpenForm}
              className="w-full bg-orange-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-lg sm:text-xl hover:bg-orange-600 transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed touch-manipulation active:scale-95"
              disabled={animal.status !== 'Available'}
            >
              <span>
                {animal.status === 'Available' ? `Adopt ${animal.name}` : `${animal.status}`}
              </span>
            </button>
            <button
              onClick={handleFavoriteClick}
              className={`p-3 sm:p-4 rounded-lg transition-colors border-2 touch-manipulation active:scale-95
                      ${
                        isFavorited
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:border-red-500/20'
                      }`}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isFavorited}
            >
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
      <AdoptionForm animal={animal} isOpen={isFormOpen} onClose={handleCloseForm} />
    </main>
  );
};

export default AnimalDetailPage;
