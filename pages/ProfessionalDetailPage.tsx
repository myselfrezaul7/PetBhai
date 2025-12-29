import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PawIcon } from '../components/icons';

const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-grow flex items-center justify-center text-center animate-fade-in">
      <article className="glass-card p-8 sm:p-12">
        <PawIcon
          className="w-16 h-16 sm:w-24 sm:h-24 text-orange-500 mx-auto mb-4 sm:mb-6 opacity-50"
          aria-hidden="true"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
          Profile Page Coming Soon!
        </h1>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mt-4 max-w-md mx-auto">
          Detailed profiles for our trusted groomers, trainers, and sitters are under construction.
          <span className="block mt-2 text-slate-500 dark:text-slate-400">
            (Viewing profile for ID: {id})
          </span>
        </p>
        <Link
          to="/services"
          className="mt-6 sm:mt-8 inline-block bg-orange-500 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-orange-600 transition-colors transform hover:scale-105 touch-manipulation active:scale-95"
        >
          Back to Services
        </Link>
      </article>
    </main>
  );
};

export default ProfessionalDetailPage;
