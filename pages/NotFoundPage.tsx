import React from 'react';
import { Link } from 'react-router-dom';
import { PawIcon } from '../components/icons';

const NotFoundPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-grow flex items-center justify-center text-center animate-fade-in">
      <article className="max-w-md">
        <PawIcon
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-orange-500 mx-auto mb-4 sm:mb-6 opacity-50"
          aria-hidden="true"
        />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-800 dark:text-white">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-200 mt-2">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 mt-3 sm:mt-4 px-2">
          Oops! It seems like this page has gone for a walk. Let's get you back home.
        </p>
        <Link
          to="/"
          className="mt-6 sm:mt-8 inline-block bg-orange-500 text-white font-bold py-2.5 px-6 sm:py-3 sm:px-8 rounded-full text-base sm:text-lg hover:bg-orange-600 transition-colors transform hover:scale-105 active:scale-95 touch-manipulation shadow-lg shadow-orange-500/30"
        >
          Back to Homepage
        </Link>
      </article>
    </main>
  );
};

export default NotFoundPage;
