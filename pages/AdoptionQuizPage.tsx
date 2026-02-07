import React from 'react';
import AdoptionQuiz from '../components/AdoptionQuiz';

const AdoptionQuizPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 sm:px-6 py-12 md:py-16 animate-fade-in">
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4">
          Am I Ready to Adopt?
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Taking a pet home is a big responsibility. Take our quick lifestyle quiz to see if
          you&apos;re ready for a furry friend!
        </p>
      </div>
      <AdoptionQuiz />
    </main>
  );
};

export default AdoptionQuizPage;
