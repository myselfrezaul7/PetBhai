import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const DhakaHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-[420px] md:h-[520px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm group">
      {/* Background Image - Dhaka Atmosphere */}
      <img
        src="/landing-hero-dhaka.jpg"
        alt="2D illustration of old Dhaka – a boy and girl holding a stray kitten and puppy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

      {/* PetBhai Branding */}
      <div className="absolute inset-0 flex items-center justify-center px-4 text-center z-10">
        <div className="bg-white/40 dark:bg-slate-900/35 backdrop-blur-[6px] p-5 md:p-7 rounded-3xl shadow-xl border border-white/45 dark:border-white/15 w-full max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-white/45 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 px-3 py-1 text-xs md:text-sm font-semibold mb-3 backdrop-blur-[2px] border border-white/40 dark:border-white/10">
            Bangladesh's Trusted Pet Care Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-orange-600 tracking-tighter drop-shadow-sm mb-2">
            PetBhai
          </h1>
          <p className="text-base md:text-xl font-bold text-slate-700 dark:text-slate-200">
            {t('hero_title')}
          </p>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 md:mt-3">
            Shop essentials, book vet help, and adopt responsibly in one place.
          </p>
          <div className="mt-5 md:mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
              {t('btn_shop')}
            </Link>
            <Link
              to="/adopt"
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
              {t('btn_adopt')}
            </Link>
            <Link
              to="/services"
              className="px-6 py-2.5 bg-white/70 hover:bg-white/85 text-slate-800 rounded-full font-bold shadow-lg transition-transform hover:scale-105 backdrop-blur-[2px] border border-white/40"
            >
              Book Services
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <span className="bg-white/45 dark:bg-slate-800/45 px-2.5 py-1 rounded-full border border-white/35 dark:border-white/10">
              Fast Delivery
            </span>
            <span className="bg-white/45 dark:bg-slate-800/45 px-2.5 py-1 rounded-full border border-white/35 dark:border-white/10">
              Verified Vets
            </span>
            <span className="bg-white/45 dark:bg-slate-800/45 px-2.5 py-1 rounded-full border border-white/35 dark:border-white/10">
              Safe Adoption
            </span>
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
