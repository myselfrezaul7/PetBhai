import React, { useState } from 'react';
import { HeartIcon, PawIcon } from '../components/icons';

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
    }, 400);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 opacity-40 dark:opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 dark:bg-orange-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 glass-card-ios rounded-3xl shadow-2xl shadow-orange-500/20 mb-6 transform hover:scale-110 transition-all duration-500">
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
        <div className="max-w-4xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="glass-card-ios p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            {/* Background Gradient Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 dark:bg-orange-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="flex-1 text-center md:text-left z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold text-sm mb-4">
                ✨ First time owner?
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3">
                Not sure if you're ready?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-0">
                Take our 2-minute lifestyle quiz to find out if you're ready for a furry friend and
                which pet suits you best!
              </p>
            </div>

            <a
              href="/#/adopt/quiz"
              className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 z-10"
            >
              <span>Take the Quiz</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Choice Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 max-w-4xl mx-auto mb-16">
          {adoptionChoices.map((choice, index) => {
            const Icon = choice.icon;
            const isHovered = hoveredChoice === choice.type;
            const isClicked = clickedChoice === choice.type;

            return (
              <button
                key={choice.type}
                onClick={() => handleChoiceClick(choice)}
                onMouseEnter={() => setHoveredChoice(choice.type)}
                onMouseLeave={() => setHoveredChoice(null)}
                className={`
                  group relative w-full md:w-80 lg:w-96
                  glass-card-ios p-6 md:p-8
                  transform transition-all duration-500 ease-out cursor-pointer
                  ${isClicked ? 'scale-95 opacity-70' : isHovered ? 'scale-105 -translate-y-2' : 'scale-100'}
                  active:scale-95 touch-manipulation
                  animate-fade-in
                `}
                style={{ animationDelay: `${index * 150}ms` }}
                aria-label={`${choice.name} through ${choice.partnerName}`}
              >
                {/* Gradient Border Effect on Hover */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${choice.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}
                />

                {/* Icon Container */}
                <div
                  className={`
                  relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-6
                  rounded-3xl bg-gradient-to-br ${choice.gradient}
                  flex items-center justify-center
                  shadow-xl
                  transform transition-all duration-500 ease-out
                  ${isHovered ? 'scale-110 rotate-3 shadow-2xl' : 'scale-100 rotate-0'}
                `}
                >
                  <Icon className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-lg" />

                  {/* Floating Emoji Badge */}
                  <div
                    className={`absolute -top-2 -right-2 w-10 h-10 rounded-full glass-card-ios flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-125 -rotate-12' : 'scale-100 rotate-0'}`}
                  >
                    <span className="text-xl">{choice.emoji}</span>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">
                  {choice.name}
                </h2>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-4">
                  {choice.description}
                </p>

                {/* Partner Badge */}
                <div
                  className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full
                  glass-card-ios
                  text-sm font-semibold text-slate-700 dark:text-slate-200
                  transition-all duration-300
                  ${isHovered ? 'shadow-lg' : 'shadow-sm'}
                `}
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">via</span>
                  <span
                    className={`bg-gradient-to-r ${choice.gradient} bg-clip-text text-transparent font-bold`}
                  >
                    {choice.partnerName}
                  </span>
                  <svg
                    className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>

                {/* Bottom Accent Line */}
                <div
                  className={`
                  absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full
                  bg-gradient-to-r ${choice.gradient}
                  transform transition-all duration-300
                  ${isHovered ? 'opacity-100 w-24' : 'opacity-0 w-16'}
                `}
                />
              </button>
            );
          })}
        </div>

        {/* Info Section */}
        <section
          className="glass-card-ios p-6 md:p-10 max-w-3xl mx-auto text-center animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <PawIcon className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
              Why Adopt Through Partners?
            </h3>
            <PawIcon className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            PetBhai believes in professional pet adoption. Our partner organizations are established
            nonprofits that ensure every animal is properly vaccinated, health-checked, and ready
            for their new home. They also provide post-adoption support to ensure a smooth
            transition.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: '🏥', label: 'Health Checked', desc: 'All pets are vet-verified' },
              { icon: '💉', label: 'Vaccinated', desc: 'Complete vaccination records' },
              { icon: '💝', label: 'Support', desc: '24/7 post-adoption care' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl glass-card-ios hover:scale-105 transition-transform duration-300"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-slate-800 dark:text-white text-sm">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Decorative Elements */}
        <div className="hidden md:block absolute bottom-10 left-10 opacity-10 dark:opacity-5 pointer-events-none">
          <PawIcon className="w-24 h-24 text-orange-500 transform rotate-12" />
        </div>
        <div className="hidden md:block absolute top-40 right-10 opacity-10 dark:opacity-5 pointer-events-none">
          <PawIcon className="w-16 h-16 text-purple-500 transform -rotate-12" />
        </div>
      </div>
    </main>
  );
};

export default AdoptPage;
