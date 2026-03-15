import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-out hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 active:scale-95"
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
