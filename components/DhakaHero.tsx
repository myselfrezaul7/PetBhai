import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const DhakaHero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-b from-sky-300 via-orange-100 to-amber-50 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm group">
      {/* 1. SUN / MOON */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-orange-400 rounded-full blur-xl opacity-80 animate-pulse" />
      <div className="absolute top-12 right-12 w-16 h-16 bg-yellow-300 rounded-full shadow-[0_0_40px_rgba(255,200,0,0.6)]" />

      {/* 2. BACKGROUND CLOUDS */}
      <div className="absolute top-20 left-10 opacity-60 animate-[float_20s_ease-in-out_infinite]">
        <CloudIcon className="w-24 h-12 text-white" />
      </div>
      <div className="absolute top-32 right-1/4 opacity-40 animate-[float_25s_ease-in-out_infinite_reverse]">
        <CloudIcon className="w-32 h-16 text-white" />
      </div>

      {/* 3. DHAKA SKYLINE (BACK LAYER - Sangsad Bhaban vibes) */}
      <div className="absolute bottom-[100px] left-0 right-0 flex items-end justify-center opacity-30 text-slate-600">
        {/* Abstract Shapes resembling Dhaka landmarks */}
        <div className="w-full flex items-end justify-between px-4">
          <div className="w-20 h-40 bg-current rounded-t-full mx-1"></div>
          <div className="w-32 h-24 bg-current polygon-triangle mx-1"></div>{' '}
          {/* Sangsad Triangle-ish */}
          <div className="w-24 h-56 bg-current mx-1 rounded-t-lg"></div>
          <div className="w-40 h-32 bg-current rounded-t-3xl mx-1"></div>
          <div className="flex-1 h-16 bg-current"></div>
          <div className="w-24 h-48 bg-current mx-1"></div>
        </div>
      </div>

      {/* 4. SKYLINE (FRONT LAYER - Residential/Commercial) */}
      <div className="absolute bottom-[80px] left-0 right-0 flex items-end text-slate-700 dark:text-slate-800">
        <div className="w-[10%] h-32 bg-current mx-1 relative">
          <WindowGrid rows={3} cols={2} />
        </div>
        <div className="w-[15%] h-52 bg-current mx-1 relative">
          <WindowGrid rows={5} cols={3} />
        </div>
        <div className="w-[20%] h-40 bg-current mx-1 relative">
          <WindowGrid rows={4} cols={4} />
        </div>
        <div className="w-[10%] h-24 bg-current mx-1 relative">
          <WindowGrid rows={2} cols={2} />
        </div>
        <div className="w-[25%] h-64 bg-current mx-1 relative">
          <WindowGrid rows={6} cols={5} />
        </div>
        <div className="w-[15%] h-32 bg-current mx-1 relative">
          <WindowGrid rows={3} cols={3} />
        </div>
      </div>

      {/* 5. GROUND / STREET */}
      <div className="absolute bottom-0 w-full h-[80px] bg-stone-700 border-t-4 border-stone-600 flex items-center overflow-hidden">
        {/* Road Markings */}
        <div className="absolute top-1/2 w-full h-0 border-t-2 border-dashed border-yellow-400 opacity-50"></div>
      </div>

      {/* 6. ANIMATED ELEMENTS */}

      {/* Rickshaw (Moving Right to Left) */}
      <div className="absolute bottom-[20px] right-[-200px] animate-[rickshawMove_15s_linear_infinite]">
        <RickshawIcon className="w-48 h-32" />
      </div>

      {/* Stray Dog (Waiting) */}
      <div className="absolute bottom-[25px] left-[15%] text-amber-700 animate-bounce-slow">
        <DogIcon className="w-12 h-12 transform -scale-x-100" />
      </div>

      {/* Stray Cat (Walking) */}
      <div className="absolute bottom-[25px] left-[40%] text-orange-600 animate-[walk_10s_linear_infinite]">
        <CatIcon className="w-8 h-8" />
      </div>

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

      {/* CSS Animations */}
      <style>{`
        @keyframes start {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes rickshawMove {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100vw); }
        }
        @keyframes walk {
          0% { transform: translateX(0); }
          50% { transform: translateX(100px); }
          50.1% { transform: translateX(100px) scaleX(-1); }
          100% { transform: translateX(0) scaleX(-1); }
        }
        .polygon-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
           0%, 100% { transform: translateY(0); }
           50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

// --- Sub-Components (SVGs) ---

const WindowGrid = ({ rows, cols }: { rows: number; cols: number }) => (
  <div
    className="absolute inset-2 grid gap-1 opacity-50"
    style={{
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    }}
  >
    {Array.from({ length: rows * cols }).map((_, i) => (
      <div
        key={i}
        className={`bg-yellow-100 rounded-[1px] ${Math.random() > 0.6 ? 'opacity-80' : 'opacity-10'}`}
      />
    ))}
  </div>
);

const CloudIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.34,0.032-0.672,0.091-0.995C11.562,12.203,11.042,12,10.5,12 c-2.485,0-4.5,2.015-4.5,4.5s2.015,4.5,4.5,4.5h7c1.381,0,2.5-1.119,2.5-2.5S18.881,19,17.5,19z M17.5,12c-0.219,0-0.432,0.026-0.638,0.071c-0.633-2.227-2.67-3.868-5.09-3.957 C10.92,5.253,9.083,3.5,6.5,3.5c-3.033,0-5.5,2.467-5.5,5.5c0,0.34,0.032,0.672,0.091,0.995C0.562,10.203,0.042,10.5,0.5,11 c0,2.485,2.015,4.5,4.5,4.5h4c0.165,0,0.325-0.023,0.481-0.061C9.69,17.398,11.458,19,13.5,19c2.485,0,4.5-2.015,4.5-4.5 S17.5,12,17.5,12z" />
  </svg>
);

const RickshawIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 60"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Wheels */}
    <circle
      cx="20"
      cy="50"
      r="8"
      className="animate-[spin_2s_linear_infinite]"
      stroke="black"
      fill="transparent"
    />
    <circle cx="20" cy="50" r="2" fill="black" />
    <circle
      cx="70"
      cy="50"
      r="8"
      className="animate-[spin_2s_linear_infinite]"
      stroke="black"
      fill="transparent"
    />
    <circle cx="70" cy="50" r="2" fill="black" />

    {/* Body */}
    <path d="M20 50 L40 50 L50 35 L75 35 L80 20 L50 20 Z" fill="#e11d48" stroke="none" />
    <path d="M20 50 L35 30 M70 50 L65 35 M80 20 L80 10 M50 20 L50 10 L80 10" stroke="black" />

    {/* Hood (Decorative) */}
    <path d="M50 35 Q 60 5 80 20" fill="#facc15" opacity="0.8" stroke="none" />
    <path d="M50 35 Q 60 5 80 20" stroke="black" />

    {/* Puller */}
    <circle cx="90" cy="20" r="3" fill="brown" stroke="none" />
    <path d="M90 23 L90 35 L85 45 M90 35 L95 45" stroke="brown" strokeWidth="3" />
  </svg>
);

const DogIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19,13H15L13,8H9L7,13H5C3.9,13,3,13.9,3,15V19H5V16H19V19H21V15C21,13.9,20.1,13,19,13M12,17C11.4,17,11,16.6,11,16C11,15.4,11.4,15,12,15C12.6,15,13,15.4,13,16C13,16.6,12.6,17,12,17Z" />
    <path d="M7,12V16H9V12H7Z" opacity="0.2" />
    <circle cx="17.5" cy="9.5" r="1.5" />
    <path d="M7.64,6.64L6.22,5.22L11,2L14,5L12.5,9H9.5L7.64,6.64Z" />
  </svg>
);

const CatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12,14C12.55,14 13,14.45 13,15V19H11V15C11,14.45 11.45,14 12,14M16,14C16.55,14 17,14.45 17,15V19H15V15C15,14.45 15.45,14 16,14M21,13V15L19,15V13H21M8,14C8.55,14 9,14.45 9,15V19H7V15C7,14.45 7.45,14 8,14M3,13V15H5V13H3M5,5L7,3L9,5L11,3L13,5H19C20.1,5 21,5.9 21,7V11H19V7H5V11H3V7C3,5.9 3.9,5 5,5Z" />
  </svg>
);

export default DhakaHero;
