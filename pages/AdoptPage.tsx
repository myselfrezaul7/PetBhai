import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartIcon, PawIcon } from '../components/icons';
import { RescueMap } from '../components/RescueMap';

// Cat Icon SVG Component
const CatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.5 2.5L18 5.5l-2-1v3l-4 2-4-2v-3l-2 1L3.5 2.5 5 8l-2 3v4c0 2.21 1.79 4 4 4h1v3h2v-3h4v3h2v-3h1c2.21 0 4-1.79 4-4v-4l-2-3 1.5-5.5zM16 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6.5 4h-5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h5c.28 0 .5.22.5.5s-.22.5-.5.5z" />
  </svg>
);

// Dog Icon SVG Component
const DogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18 4c-1.21 0-2.25.72-2.72 1.76L13 4.72V3c0-.55-.45-1-1-1s-1 .45-1 1v1.72l-2.28 1.04C8.25 4.72 7.21 4 6 4 4.34 4 3 5.34 3 7v6c0 1.1.9 2 2 2v6c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-6c1.1 0 2-.9 2-2V7c0-1.66-1.34-3-3-3zM8.5 10c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm7 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
  </svg>
);

interface AdoptionChoice {
  type: 'cat' | 'dog';
  name: string;
  icon: React.FC<{ className?: string }>;
  url: string;
  partnerName: string;
  gradient: string;
  iconGradient: string;
  partnerColor: string;
  partnerColorDark: string;
  description: string;
  emoji: string;
}

const adoptionChoices: AdoptionChoice[] = [
  {
    type: 'cat',
    name: 'বিড়াল দত্তক নিন',
    icon: CatIcon,
    url: 'https://www.catwaala.com/',
    partnerName: 'CatWaala',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    iconGradient: 'from-purple-500 via-pink-500 to-rose-500',
    partnerColor: 'text-pink-600',
    partnerColorDark: 'dark:text-pink-400',
    description: 'Find your perfect feline companion through our trusted partner',
    emoji: '🐱',
  },
  {
    type: 'dog',
    name: 'কুকুর দত্তক নিন',
    icon: DogIcon,
    url: 'https://www.kuttawaala.com/',
    partnerName: 'KuttaWaala',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    iconGradient: 'from-amber-500 via-orange-500 to-red-500',
    partnerColor: 'text-orange-600',
    partnerColorDark: 'dark:text-orange-400',
    description: 'Find your loyal canine friend through our trusted partner',
    emoji: '🐕',
  },
];

const AdoptPage: React.FC = () => {
  const [hoveredChoice, setHoveredChoice] = useState<'cat' | 'dog' | null>(null);
  const [clickedChoice, setClickedChoice] = useState<'cat' | 'dog' | null>(null);

  const handleChoiceClick = (choice: AdoptionChoice) => {
    setClickedChoice(choice.type);
    setTimeout(() => {
      window.open(choice.url, '_blank', 'noopener,noreferrer');
      setClickedChoice(null);
    }, 350);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-rose-50/50 to-purple-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 opacity-30 dark:opacity-15">
          <div className="absolute top-20 left-10 w-80 h-80 bg-orange-200 dark:bg-orange-700 rounded-full filter blur-[80px] animate-blob" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-purple-200 dark:bg-purple-700 rounded-full filter blur-[80px] animate-blob" />
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-200 dark:bg-pink-700 rounded-full filter blur-[80px] animate-blob" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-18 h-18 md:w-22 md:h-22 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 mb-6 p-4 transition-transform duration-500 hover:scale-105">
            <HeartIcon className="w-10 h-10 md:w-12 md:h-12 text-orange-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-rose-500 to-purple-600 dark:from-orange-400 dark:via-rose-400 dark:to-purple-400 bg-clip-text text-transparent mb-4 md:mb-6 leading-tight">
            Give a Pet a Forever Home
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
            PetBhai partners with trusted nonprofit organizations to help you find your perfect
            companion. Choose below to start your adoption journey.
          </p>
        </header>

        {/* Quiz CTA Section */}
        <div className="max-w-4xl mx-auto mb-14">
          <div className="relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-lg shadow-slate-900/5 dark:shadow-black/20 group transition-shadow duration-500 hover:shadow-xl">
            {/* Subtle background accent */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-full -translate-y-1/3 translate-x-1/4 opacity-60 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex-1 text-center md:text-left z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-bold text-sm mb-4">
                ✨ First time owner?
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Not sure if you&apos;re ready?
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-0">
                Take our 2-minute lifestyle quiz to find out if you&apos;re ready for a furry friend
                and which pet suits you best!
              </p>
            </div>

            <Link
              to="/adopt/quiz"
              className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 px-7 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2.5 z-10 text-sm md:text-base"
            >
              <span>Take the Quiz</span>
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-8 max-w-3xl mx-auto mb-14">
          {adoptionChoices.map((choice, index) => {
            const Icon = choice.icon;
            const isHovered = hoveredChoice === choice.type;
            const isClicked = clickedChoice === choice.type;

            return (
              <motion.button
                key={choice.type}
                onClick={() => handleChoiceClick(choice)}
                onMouseEnter={() => setHoveredChoice(choice.type)}
                onMouseLeave={() => setHoveredChoice(null)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  group relative w-full md:w-1/2 text-center
                  bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl
                  border border-slate-200/60 dark:border-slate-700/40
                  rounded-2xl p-6 md:p-8
                  shadow-md shadow-slate-900/5 dark:shadow-black/20
                  cursor-pointer
                  transition-colors duration-300 ease-out
                  ${isClicked ? 'opacity-80' : isHovered ? 'shadow-xl' : ''}
                  
                `}
                aria-label={`${choice.name} through ${choice.partnerName}`}
              >
                {/* Subtle gradient overlay on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${choice.gradient} transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-[0.04]' : 'opacity-0'}`}
                />

                {/* Icon Container */}
                <div
                  className={`
                  relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-5
                  rounded-2xl bg-gradient-to-br ${choice.iconGradient}
                  flex items-center justify-center
                  shadow-lg
                  transition-all duration-300 ease-out
                  ${isHovered ? 'scale-105 shadow-xl' : ''}
                `}
                >
                  <Icon className="w-12 h-12 md:w-14 md:h-14 text-white" />

                  {/* Floating Emoji Badge */}
                  <div
                    className={`absolute -top-2 -right-2 w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-md transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}
                  >
                    <span className="text-lg">{choice.emoji}</span>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {choice.name}
                </h2>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-300 mb-5 leading-relaxed">
                  {choice.description}
                </p>

                {/* Partner Badge - FIXED: solid colors instead of gradient text */}
                <div
                  className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full
                  bg-slate-50 dark:bg-slate-700/50
                  border border-slate-200/80 dark:border-slate-600/50
                  transition-all duration-300
                  ${isHovered ? 'shadow-md' : ''}
                `}
                >
                  <span className="text-xs uppercase tracking-wider font-medium text-slate-400 dark:text-slate-300">
                    via
                  </span>
                  <span
                    className={`font-bold text-sm ${choice.partnerColor} ${choice.partnerColorDark}`}
                  >
                    {choice.partnerName}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 ${choice.partnerColor} ${choice.partnerColorDark} transition-transform duration-300 ${isHovered ? 'translate-x-0.5' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>

                {/* Bottom Accent Line */}
                <div
                  className={`
                  absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full
                  bg-gradient-to-r ${choice.gradient}
                  transition-all duration-300
                  ${isHovered ? 'opacity-100 w-20' : 'opacity-0 w-12'}
                `}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Spatial Rescue Map Section */}
        <section className="max-w-5xl mx-auto mb-16">
           <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Live Rescue Radar</h3>
              <p className="text-slate-600 dark:text-slate-300">Discover pets needing immediate help in your area.</p>
           </div>
           <RescueMap />
        </section>

        {/* Info Section */}
        <section className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/40 rounded-2xl p-6 md:p-10 max-w-3xl mx-auto text-center shadow-lg shadow-slate-900/5 dark:shadow-black/20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PawIcon className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              Why Adopt Through Partners?
            </h3>
            <PawIcon className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto">
            PetBhai believes in professional pet adoption. Our partner organizations ensure every
            animal is properly vaccinated, health-checked, and ready for their new home.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: '🏥', label: 'Health Checked', desc: 'All pets are vet-verified' },
              { icon: '💉', label: 'Vaccinated', desc: 'Complete vaccination records' },
              { icon: '💝', label: 'Support', desc: '24/7 post-adoption care' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/30 hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-slate-800 dark:text-white text-sm">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Decorative Elements */}
        <div className="hidden md:block absolute bottom-10 left-10 opacity-[0.06] dark:opacity-[0.03] pointer-events-none">
          <PawIcon className="w-24 h-24 text-orange-500 transform rotate-12" />
        </div>
        <div className="hidden md:block absolute top-40 right-10 opacity-[0.06] dark:opacity-[0.03] pointer-events-none">
          <PawIcon className="w-16 h-16 text-purple-500 transform -rotate-12" />
        </div>
      </div>
    </main>
  );
};

export default AdoptPage;
