import React, { useEffect, useState } from 'react';

const ReadingProgressBar: React.FC = () => {
  const [readingProgress, setReadingProgress] = useState(0);

  const scrollListener = () => {
    if (!window) return;
    const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (documentHeight > 0) {
      const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
      const progress = (scrollPosition / documentHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', scrollListener);
    // Initial check
    scrollListener();
    return () => window.removeEventListener('scroll', scrollListener);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-1.5 z-50 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(readingProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 backdrop-blur-md shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
    </div>
  );
};

export default ReadingProgressBar;
