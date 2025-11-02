import React from 'react';
import type { Groomer, Trainer, PetSitter } from '../types';

interface ServiceCardProps {
  professional: Groomer | Trainer | PetSitter;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ professional }) => {
    
  let details = '';
  if (professional.category === 'Groomer') {
      details = professional.specialties.join(', ');
  } else if (professional.category === 'Trainer') {
      details = professional.methods;
  } else if (professional.category === 'Pet Sitter') {
      details = professional.servicesOffered.join(' / ');
  }

  return (
    <div className="glass-card flex flex-col text-center items-center p-6 group transition-transform transform hover:-translate-y-2">
      <div className="relative">
        <img className="w-32 h-32 rounded-full object-cover ring-4 ring-orange-500/20" src={professional.imageUrl} alt={professional.name} loading="lazy" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4 group-hover:text-orange-500 transition-colors">{professional.name}</h3>
      <p className="text-orange-600 dark:text-orange-400 font-semibold">{professional.category}</p>
      
       <div className="flex items-center justify-center space-x-2 mt-4 text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{professional.rating.toFixed(1)}</span>
          </div>
          <span>&bull;</span>
          <span>{professional.location}</span>
       </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 mt-4 flex-grow line-clamp-2">{professional.bio}</p>

      <div className="mt-4 w-full pt-4 border-t border-white/20 dark:border-slate-700/50">
          <span className="w-full block bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg group-hover:bg-orange-600 transition-colors">
            View Details
          </span>
      </div>
    </div>
  );
};

export default React.memo(ServiceCard);