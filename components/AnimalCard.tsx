import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Animal } from '../types';
import { HeartIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';

interface AnimalCardProps {
  animal: Animal;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => {
  const { isAuthenticated, currentUser, favoritePet, unfavoritePet } = useAuth();
  const toast = useToast();

  const isFavorited = useMemo(() => {
    return currentUser?.favorites.includes(animal.id) ?? false;
  }, [currentUser, animal.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please log in to favorite pets.');
      return;
    }
    if (isFavorited) {
      unfavoritePet(animal.id);
    } else {
      favoritePet(animal.id);
    }
  };

  const statusColors = {
    Available: 'bg-green-500/90 text-white',
    Pending: 'bg-yellow-500/90 text-white',
    Adopted: 'bg-slate-500/90 text-white',
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="relative overflow-hidden aspect-[4/3]">
        <Link to={`/adopt/${animal.id}`} className="block h-full">
          <img
            src={animal.imageUrl}
            alt={animal.name}
            className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            decoding="async"
            sizes={getResponsiveImageSizes('card')}
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 hidden sm:flex">
            <p className="text-white font-bold tracking-wider border-2 border-white px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              View Details
            </p>
          </div>
        </Link>
        <div
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${statusColors[animal.status]}`}
        >
          {animal.status}
        </div>
        <button
          onClick={handleFavoriteClick}
          className={`absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all duration-300 shadow-md hover:scale-110 active:scale-90 touch-manipulation sm:right-3 sm:top-3
                ${
                  isFavorited
                    ? 'bg-red-500 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:text-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-zinc-300'
                }`}
          aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
        >
          <HeartIcon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm sm:text-2xl font-bold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {animal.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-[10px] sm:text-sm mt-0.5 sm:mt-1 line-clamp-1">
              {animal.breed}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Age
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {animal.age}
            </span>
          </div>
        </div>

        <div className="mt-1 sm:mt-4 pt-1 sm:pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center justify-between text-[10px] sm:text-sm text-slate-600 dark:text-slate-300 gap-1">
          <span className="sm:hidden font-semibold">{animal.age}</span>
          <span className="sm:hidden text-slate-400">&bull;</span>
          <span>{animal.gender}</span>
          <span className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></span>
          <span>{animal.size}</span>
        </div>

        <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-4 flex-grow text-[10px] sm:text-sm line-clamp-2 leading-relaxed">
          {animal.description}
        </p>
      </div>
      <div className="mt-auto border-t border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <Link
          to={`/adopt/${animal.id}`}
          className="block min-h-[44px] w-full rounded-full bg-slate-950 px-3 py-2 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95 touch-manipulation sm:px-4 sm:py-3 sm:text-base"
        >
          Meet {animal.name}
        </Link>
      </div>
    </div>
  );
};

export default React.memo(AnimalCard);
