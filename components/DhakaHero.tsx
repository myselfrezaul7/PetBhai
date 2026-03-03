import React from 'react';
import { Link } from 'react-router-dom';
import { PawIcon, HeartIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const DhakaHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="glass-card-ios-heavy relative w-full rounded-2xl md:rounded-3xl overflow-hidden p-6 md:p-12 text-center group">
      <div className="flex flex-col items-center max-w-2xl mx-auto space-y-4">
        {/* Icon Badge */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 rounded-full shadow-inner">
          <HeartIcon className="absolute w-full h-full text-orange-200/50 dark:text-orange-500/10 scale-150 animate-pulse" />
          <PawIcon className="w-8 h-8 md:w-10 md:h-10 text-orange-500 z-10" />
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
          {t('hero_title')}
        </h1>
        
        <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300">
          Shop essentials, book vet help, and adopt responsibly in one place.
        </p>

        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3 mt-4">
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg transition-all active:scale-95 touch-manipulation hover:shadow-orange-500/30"
          >
            {t('btn_shop')}
          </Link>
          <Link
            to="/services"
            className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 rounded-full font-bold shadow-sm transition-all active:scale-95 touch-manipulation"
          >
            Book Services
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DhakaHero;
