import React from 'react';
import { Link } from 'react-router-dom';
import type { Groomer, Trainer, PetSitter } from '../types';

interface ServiceCardProps {
  professional: Groomer | Trainer | PetSitter;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ professional }) => {
    
  return (
    <Link to={`/services/professional/${professional.id}`} className="glass-card flex flex-col text-center items-center p-3 sm:p-6 group transition-transform transform hover:-translate-y-2 h-full">
      <div className="relative">
        <img className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-orange-500/20" src={professional.imageUrl} alt={professional.name} loading="lazy" />
      </div>
      <h3 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white mt-3 sm:mt-4 group-hover:text-orange-500 transition-colors line-clamp-1">{professional.name}</h3>
      <p className="text-xs sm:text-base text-orange-600 dark:text-orange-400 font-semibold">{professional.category}</p>
      
       <div className="flex items-center justify-center space-x-2 mt-2 sm:mt-4 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
          <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{professional.rating.toFixed(1)}</span>
          </div>
          <span>&bull;</span>
          <span className="line-clamp-1">{professional.location}</span>
       </div>

      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 sm:mt-4 flex-grow line-clamp-2">{professional.bio}</p>

      <div className="mt-3 sm:mt-4 w-full pt-3 sm:pt-4 border-t border-white/20 dark:border-slate-700/50">
          <span className="w-full block bg-orange-500 text-white font-bold py-2 sm:py-2.5 px-4 rounded-lg text-xs sm:text-base group-hover:bg-orange-600 transition-colors">
            Details
          </span>
      </div>
    </Link>
  );
};

export default React.memo(ServiceCard);