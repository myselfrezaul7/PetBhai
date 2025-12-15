import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PawIcon } from '../components/icons';

const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-6 py-12 flex-grow flex items-center justify-center text-center animate-fade-in">
      <div className="glass-card p-12">
        <PawIcon className="w-24 h-24 text-orange-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Profile Page Coming Soon!
        </h1>
        <p className="text-slate-700 dark:text-slate-200 mt-4 max-w-md mx-auto">
          Detailed profiles for our trusted groomers, trainers, and sitters are under construction.
          (Viewing profile for ID: {id})
        </p>
        <Link
          to="/services"
          className="mt-8 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-orange-600 transition-colors transform hover:scale-105"
        >
          Back to Services
        </Link>
      </div>
    </div>
  );
};

export default ProfessionalDetailPage;
