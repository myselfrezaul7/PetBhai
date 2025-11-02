import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Animal } from '../types';
import { HeartIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface AnimalCardProps {
  animal: Animal;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => {
  const { isAuthenticated, currentUser, favoritePet, unfavoritePet } = useAuth();

  const isFavorited = useMemo(() => {
    return currentUser?.favorites.includes(animal.id) ?? false;
  }, [currentUser, animal.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation();
    if (!isAuthenticated) {
        alert("Please log in to favorite pets.");
        return;
    }
    if (isFavorited) {
      unfavoritePet(animal.id);
    } else {
      favoritePet(animal.id);
    }
  };
  
  const statusColors = {
    Available: 'bg-green-500 text-green-50',
    Pending: 'bg-yellow-500 text-yellow-50',
    Adopted: 'bg-slate-500 text-slate-50',
  };

  return (
    <div className="glass-card overflow-hidden flex flex-col group">
      <div className="relative">
        <Link to={`/adopt/${animal.id}`} className="block">
            <img src={animal.imageUrl} alt={animal.name} className="w-full h-56 object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <p className="text-white text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-wider">Learn More</p>
            </div>
        </Link>
        <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full ${statusColors[animal.status]}`}>
            {animal.status}
        </div>
         <button 
            onClick={handleFavoriteClick} 
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isFavorited 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white'}`}
            aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
            >
            <HeartIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{animal.name}</h3>
        <p className="text-slate-700 dark:text-slate-200 font-medium">{animal.breed}</p>
        <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">{animal.age} &bull; {animal.gender} &bull; {animal.size}</p>
        <p className="text-slate-700 dark:text-slate-300 mt-4 flex-grow text-base line-clamp-3">{animal.description}</p>
      </div>
       <div className="p-4 bg-black/5 dark:bg-black/10 mt-auto">
          <Link to={`/adopt/${animal.id}`} className="w-full text-center block bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg group-hover:bg-orange-600 transition-colors">
            Adopt Me
          </Link>
        </div>
    </div>
  );
};

export default React.memo(AnimalCard);