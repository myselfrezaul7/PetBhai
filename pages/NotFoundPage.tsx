import React from 'react';
import { Link } from 'react-router-dom';
import { PawIcon } from '../components/icons';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-12 flex-grow flex items-center justify-center text-center animate-fade-in">
      <div>
        <PawIcon className="w-24 h-24 text-orange-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-extrabold text-slate-800 dark:text-white">404</h1>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200 mt-2">Page Not Found</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mt-4 max-w-md mx-auto">
          Oops! It seems like this page has gone for a walk. Let's get you back home.
        </p>
        <Link 
          to="/" 
          className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors transform hover:scale-105"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
