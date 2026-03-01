/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './App.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'toast-in': 'slideInRight 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'toast-out': 'slideOutRight 0.24s cubic-bezier(0.4, 0, 1, 1) forwards',
        'slide-up': 'slideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down': 'slideDown 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        blob: 'blob 14s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
        glow: 'glow 3.5s ease-in-out infinite alternate',
        shimmer: 'shimmer 2s linear infinite',
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(12px, -18px) scale(1.04)' },
          '66%': { transform: 'translate(-10px, 10px) scale(0.97)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 12px rgba(249, 115, 22, 0.22)' },
          '100%': { boxShadow: '0 0 24px rgba(249, 115, 22, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ios-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        glass: '20px',
        'glass-heavy': '40px',
      },
      borderColor: {
        glass: 'var(--ui-border-glass)',
      },
      backgroundColor: {
        glass: 'var(--ui-surface)',
        'glass-hover': 'var(--ui-surface-hover)',
      },
    },
  },
  plugins: [],
};
