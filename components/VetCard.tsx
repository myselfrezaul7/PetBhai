import React from 'react';
import { Link } from 'react-router-dom';
import type { Vet } from '../types';
import { VideoCameraIcon } from './icons';
import { getResponsiveImageSizes, handleImageError } from '../lib/imageUtils';

interface VetCardProps {
  vet: Vet;
}

const VetCard: React.FC<VetCardProps> = ({ vet }) => {
  const availabilityStyles: { [key in Vet['availability']]: string } = {
    'Available Now': 'bg-green-500 text-green-50 animate-pulse',
    'Available Today': 'bg-amber-500 dark:bg-amber-600 text-white',
    Offline: 'bg-zinc-400 text-white',
  };

  return (
    <Link
      to={`/vet/${vet.id}`}
      className="group flex h-full flex-col items-center rounded-3xl border border-amber-900/10 dark:border-amber-100/10 bg-white/95 dark:bg-zinc-900/95 p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-100/10 dark:bg-zinc-900/95 sm:p-6"
    >
      <div className="relative">
        <img
          className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover ring-2 sm:ring-4 ring-amber-200 dark:ring-zinc-700 dark:ring-amber-200 dark:ring-zinc-700 transition-all duration-500 group-hover:ring-slate-400 dark:group-hover:ring-slate-500 group-hover:scale-105"
          src={vet.imageUrl}
          alt={`Dr. ${vet.name}`}
          loading="lazy"
          decoding="async"
          sizes={getResponsiveImageSizes('avatar')}
          onError={handleImageError}
        />
        <span
          aria-label={`Availability: ${vet.availability}`}
          className={`absolute bottom-0 right-0 block h-max w-max px-1.5 py-0.5 sm:px-2 border-2 border-white dark:border-amber-100/10 rounded-full text-[9px] sm:text-xs font-bold ${availabilityStyles[vet.availability]}`}
        >
          {vet.availability === 'Available Now'
            ? 'Now'
            : vet.availability === 'Available Today'
              ? 'Today'
              : 'Offline'}
        </span>
      </div>
      <h3 className="text-xs sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-2 sm:mt-4 group-hover:text-slate-950 dark:group-hover:text-white transition-colors line-clamp-1">
        {vet.name}
      </h3>
      <p className="text-[10px] sm:text-base text-zinc-500 dark:text-zinc-400 font-semibold line-clamp-1">
        {vet.specialization}
      </p>

      <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-1 sm:mt-4 text-zinc-500 dark:text-zinc-400">
        {vet.services.some((s) => s.type === 'in-clinic') && (
          <div className="flex items-center space-x-1 text-[10px] sm:text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Clinic</span>
          </div>
        )}
        {vet.services.some((s) => s.type === 'online') && (
          <div className="flex items-center space-x-1 text-[10px] sm:text-sm">
            <VideoCameraIcon className="w-3 h-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Online</span>
          </div>
        )}
      </div>

      <p className="text-[10px] sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 sm:mt-4 flex-grow line-clamp-2 leading-tight">
        {vet.bio}
      </p>

      <div className="mt-2 sm:mt-4 w-full pt-2 sm:pt-4 border-t border-amber-900/10 dark:border-amber-100/10">
        <span className="flex min-h-[44px] w-full items-center justify-center rounded-full bg-slate-950 px-2 py-2 text-[10px] font-bold text-white shadow-sm transition-all duration-500 group-hover:bg-black sm:px-4 sm:py-2.5 sm:text-base">
          Profile
        </span>
      </div>
    </Link>
  );
};

export default React.memo(VetCard);
