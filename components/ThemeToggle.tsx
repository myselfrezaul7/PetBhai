import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 dark:border-slate-600/80 bg-white/75 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.04] hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 active:scale-95"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">Toggle theme</span>

      <span className="relative h-4 w-4">
        <SunIcon
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-45 scale-75'
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-out ${
            isDark ? 'opacity-0 -rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
