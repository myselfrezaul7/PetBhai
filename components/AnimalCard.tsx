import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Animal } from '../types';
import { HeartIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
        toast.info("Please log in to favorite pets.");
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
    <div className="glass-card group overflow-hidden flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full">
      <div className="relative overflow-hidden aspect-[4/3]">
        <Link to={`/adopt/${animal.id}`} className="block h-full">
            <img 
                src={animal.imageUrl} 
                alt={animal.name} 
                className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-110" 
                loading="lazy" 
                decoding="async"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 hidden sm:flex">
                <p className="text-white font-bold tracking-wider border-2 border-white px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">View Details</p>
            </div>
        </Link>
        <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full backdrop-blur-md shadow-sm ${statusColors[animal.status]}`}>
            {animal.status}
        </div>
         <button 
            onClick={handleFavoriteClick} 
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 active:scale-90
                ${isFavorited 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/80 backdrop-blur-md text-slate-600 hover:text-red-500'}`}
            aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
            >
            <HeartIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-base sm:text-2xl font-bold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{animal.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">{animal.breed}</p>
            </div>
            <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Age</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{animal.age}</span>
            </div>
        </div>
        
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 gap-1">
             <span className="sm:hidden font-semibold">{animal.age}</span>
             <span className="sm:hidden text-slate-400">&bull;</span>
             <span>{animal.gender}</span>
             <span className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></span>
             <span>{animal.size}</span>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mt-2 sm:mt-4 flex-grow text-xs sm:text-sm line-clamp-2 leading-relaxed">{animal.description}</p>
      </div>
       <div className="p-3 sm:p-4 bg-white/50 dark:bg-black/20 mt-auto border-t border-white/20 dark:border-slate-700/30">
          <Link 
            to={`/adopt/${animal.id}`} 
            className="w-full text-center block bg-orange-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-base hover:bg-orange-600 transition-all shadow-md active:scale-95"
          >
            Meet {animal.name}
          </Link>
        </div>
    </div>
  );
};

export default React.memo(AnimalCard);