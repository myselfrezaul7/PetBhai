import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const DhakaHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm group">
      {/* Background Image - Dhaka Atmosphere */}
      <img
        src="/landing-hero-dhaka.png"
        alt="Dhaka Street Atmosphere with Strays"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />




      {/* PetBhai Branding */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/40">
          <h1 className="text-4xl md:text-6xl font-black text-orange-600 tracking-tighter drop-shadow-sm mb-2">
            PetBhai
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200">
            {t('hero_title')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/adopt"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
              {t('btn_adopt')}
            </Link>
            <Link
              to="/shop"
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
              {t('btn_shop')}
            </Link>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .polygon-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
      `}</style>
    </div>
  );
};

// --- Sub-Components (SVGs) ---



export default DhakaHero;
