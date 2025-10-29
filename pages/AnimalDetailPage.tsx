import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_ANIMALS } from '../constants';
import AdoptionForm from '../components/AdoptionForm';
import { HeartIcon } from '../components/icons';

const AnimalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const animal = MOCK_ANIMALS.find(a => a.id === Number(id));
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!animal) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Animal not found!</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-4">The animal you are looking for might have been adopted or the link is incorrect.</p>
        <Link to="/adopt" className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors">
            Back to Adoption Page
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden md:flex">
            <div className="md:w-1/2">
                <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover min-h-[300px]" />
            </div>
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white">{animal.name}</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 font-semibold mt-2">{animal.breed}</p>
                    <div className="mt-4 text-lg text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                        <span>{animal.age} old</span>
                        <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                        <span>{animal.gender}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-6 leading-relaxed text-lg">{animal.description}</p>
                </div>
                <div className="mt-8">
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-lg text-xl hover:bg-orange-600 transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <HeartIcon className="w-6 h-6" />
                        <span>Apply to Adopt {animal.name}</span>
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
