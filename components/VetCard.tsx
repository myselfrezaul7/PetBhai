import React from 'react';
import { Link } from 'react-router-dom';
import type { Vet } from '../types';
import { VideoCameraIcon } from './icons';

interface VetCardProps {
  vet: Vet;
}

const VetCard: React.FC<VetCardProps> = ({ vet }) => {
    
  const availabilityStyles: { [key in Vet['availability']]: string } = {
    'Available Now': 'bg-green-500 text-green-50 animate-pulse',
    'Available Today': 'bg-blue-500 text-blue-50',
    'Offline': 'bg-slate-500 text-slate-50',
  };

  return (
    <Link to={`/vet/${vet.id}`} className="glass-card flex flex-col text-center items-center p-3 sm:p-6 group transition-transform transform hover:-translate-y-2 h-full">
      <div className="relative">
        <img 
            className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover ring-2 sm:ring-4 ring-orange-500/20" 
            src={vet.imageUrl} 
            alt={`Dr. ${vet.name}`} 
            loading="lazy" 
            decoding="async"
        />
        <span className={`absolute bottom-0 right-0 block h-max w-max px-1.5 py-0.5 sm:px-2 border-2 border-white dark:border-slate-800 rounded-full text-[9px] sm:text-xs font-bold ${availabilityStyles[vet.availability]}`}>
            {vet.availability === 'Available Now' ? 'Now' : (vet.availability === 'Available Today' ? 'Today' : 'Offline')}
        </span>
      </div>
      <h3 className="text-xs sm:text-xl font-bold text-slate-800 dark:text-white mt-2 sm:mt-4 group-hover:text-orange-500 transition-colors line-clamp-1">{vet.name}</h3>
      <p className="text-[10px] sm:text-base text-orange-600 dark:text-orange-400 font-semibold line-clamp-1">{vet.specialization}</p>
      
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-1 sm:mt-4 text-slate-600 dark:text-slate-300">
        {vet.services.some(s => s.type === 'in-clinic') && (
            <div className="flex items-center space-x-1 text-[10px] sm:text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="hidden sm:inline">Clinic</span>
            </div>
        )}
         {vet.services.some(s => s.type === 'online') && (
            <div className="flex items-center space-x-1 text-[10px] sm:text-sm">
                <VideoCameraIcon className="w-3 h-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Online</span>
            </div>
        )}
      </div>

      <p className="text-[10px] sm:text-sm text-slate-700 dark:text-slate-300 mt-2 sm:mt-4 flex-grow line-clamp-2 leading-tight">{vet.bio}</p>

      <div className="mt-2 sm:mt-4 w-full pt-2 sm:pt-4 border-t border-white/20 dark:border-slate-700/50">
          <span
            className="w-full block bg-orange-500 text-white font-bold py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-lg text-[10px] sm:text-base group-hover:bg-orange-600 transition-colors"
          >
            Profile
          </span>
      </div>
    </Link>
  );
};

export default React.memo(VetCard);