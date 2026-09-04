import React, { useEffect, useState } from 'react';

const ReadingProgressBar: React.FC = () => {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    let frameId: number | null = null;

    const updateProgress = () => {
      const documentHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (documentHeight > 0) {
        const scrollPosition =
          window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const progress = (scrollPosition / documentHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
      frameId = null;
    };

    const scrollListener = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', scrollListener);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      className="fixed top-[64px] lg:top-[72px] left-0 w-full h-2 z-40 pointer-events-none animate-fade-in"
      role="progressbar"
      aria-valuenow={Math.round(readingProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative w-full h-full">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 backdrop-blur-md shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
        {/* Completion Indicator */}
        <div
          className={`absolute right-4 top-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 transition-all duration-500 transform ${readingProgress > 99 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Read
        </div>
      </div>
    </div>
  );
};

export default ReadingProgressBar;
