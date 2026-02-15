import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex h-11 w-20 items-center rounded-full border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-orange-500"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">Toggle theme</span>

      <span
        className={`absolute left-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg transition-transform duration-300 ${isDark ? 'translate-x-9' : 'translate-x-0'}`}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </span>

      <span
        className={`absolute left-3 text-[10px] font-bold uppercase tracking-wide transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-80 text-slate-500 dark:text-slate-300'}`}
      >
        Light
      </span>
      <span
        className={`absolute right-3 text-[10px] font-bold uppercase tracking-wide transition-opacity duration-300 ${isDark ? 'opacity-80 text-slate-500 dark:text-slate-300' : 'opacity-0'}`}
      >
        Dark
      </span>
    </button>
  );
};

export default ThemeToggle;
