import React from 'react';
import { PawIcon } from '../components/icons';

const ConsultVetPage: React.FC = () => {
  return (
    <main className="container mx-auto px-6 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <div className="glass-card-ios p-12 max-w-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 -mb-10 -mr-10 w-40 h-40 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>

        <PawIcon className="w-20 h-20 text-blue-500 mb-6 mx-auto animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4">
          Online Consultation
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-6">
          Coming Soon
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">
          Get expert veterinary advice from the comfort of your home. Our video consultation
          platform is almost ready!
        </p>
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          Launching Soon
        </div>
      </div>
    </main>
  );
};

export default ConsultVetPage;
