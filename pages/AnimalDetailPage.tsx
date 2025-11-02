import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_ANIMALS } from '../constants';
import AdoptionForm from '../components/AdoptionForm';
import { HeartIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';

const AnimalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const animal = MOCK_ANIMALS.find(a => a.id === Number(id));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { isAuthenticated, currentUser, favoritePet, unfavoritePet } = useAuth();

  const isFavorited = useMemo(() => {
    return currentUser?.favorites.includes(animal?.id ?? -1) ?? false;
  }, [currentUser, animal]);
  
  const handleFavoriteClick = () => {
    if (!isAuthenticated || !animal) {
        alert("Please log in to favorite pets.");
        return;
    }
    if (isFavorited) {
      unfavoritePet(animal.id);
    } else {
      favoritePet(animal.id);
    }
  };


  if (!animal) {
    return (
      <div className="text-center py-20 animate-fade-in container mx-auto px-6">
        <div className="glass-card p-12">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Animal not found!</h1>
            <p className="text-slate-700 dark:text-slate-200 mt-4">The animal you are looking for might have been adopted or the link is incorrect.</p>
            <Link to="/adopt" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
                Back to Adoption Page
            </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="glass-card overflow-hidden md:flex">
            <div className="md:w-1/2">
                <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover min-h-[300px]" />
            </div>
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white">{animal.name}</h1>
                    <p className="text-xl text-slate-700 dark:text-slate-200 font-semibold mt-2">{animal.breed}</p>
                    <div className="mt-4 text-lg text-slate-600 dark:text-slate-300 flex items-center space-x-4">
                        <span>{animal.age}</span>
                        <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                        <span>{animal.gender}</span>
                        <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                        <span>{animal.size}</span>
                         <span className="text-slate-400 dark:text-slate-500">&bull;</span>
                        <span className={`px-2 py-0.5 text-sm rounded-full ${animal.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{animal.status}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-6 leading-relaxed text-lg">{animal.description}</p>
                </div>
                <div className="mt-8 flex items-center space-x-4">
                     <button 
                        onClick={() => setIsFormOpen(true)}
                        className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-lg text-xl hover:bg-orange-600 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed"
                        disabled={animal.status !== 'Available'}
                    >
                        <span>{animal.status === 'Available' ? `Adopt ${animal.name}` : `${animal.status}`}</span>
                    </button>
                    <button 
                        onClick={handleFavoriteClick} 
                        className={`p-4 rounded-lg transition-colors border-2 
                        ${isFavorited 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:border-red-500/20'}`}
                        aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
                    >
                        <HeartIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
      </div>
      <AdoptionForm 
        animal={animal}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
};

export default AnimalDetailPage;