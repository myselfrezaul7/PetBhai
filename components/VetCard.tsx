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
    <Link to={`/vet/${vet.id}`} className="glass-card flex flex-col text-center items-center p-6 group transition-transform transform hover:-translate-y-2">
      <div className="relative">
        <img className="w-32 h-32 rounded-full object-cover ring-4 ring-orange-500/20" src={vet.imageUrl} alt={`Dr. ${vet.name}`} loading="lazy" />
        <span className={`absolute bottom-0 right-0 block h-6 w-max px-2 py-0.5 border-2 border-white dark:border-slate-800 rounded-full text-xs font-bold ${availabilityStyles[vet.availability]}`}>
            {vet.availability}
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4 group-hover:text-orange-500 transition-colors">{vet.name}</h3>
      <p className="text-orange-600 dark:text-orange-400 font-semibold">{vet.specialization}</p>
      
      <div className="flex items-center justify-center space-x-4 mt-4 text-slate-600 dark:text-slate-300">
        {vet.services.some(s => s.type === 'in-clinic') && (
            <div className="flex items-center space-x-1.5 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>In-Clinic</span>
            </div>
        )}
         {vet.services.some(s => s.type === 'online') && (
            <div className="flex items-center space-x-1.5 text-sm">
                <VideoCameraIcon className="w-4 h-4" />
                <span>Online</span>
            </div>
        )}
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 mt-4 flex-grow line-clamp-2">{vet.bio}</p>

      <div className="mt-4 w-full pt-4 border-t border-white/20 dark:border-slate-700/50">
          <span
            className="w-full block bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg group-hover:bg-orange-600 transition-colors"
          >
            View Profile
          </span>
      </div>
    </Link>
  );
};

export default React.memo(VetCard);