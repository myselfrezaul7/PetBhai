import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useScrollDirection } from '../hooks/useScrollDirection';

const HomeGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 3.2 3 10.4V21h6.75v-6h4.5v6H21V10.4l-9-7.2z" />
  </svg>
);

const ShopGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M6 2.75A1.75 1.75 0 0 0 4.25 4.5V7H3a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-1.25V4.5A1.75 1.75 0 0 0 18 2.75H6zm.25 4.25V4.75h11.5V7H6.25zm4.25 3h3a1 1 0 0 1 0 2h-3a1 1 0 1 1 0-2z" />
  </svg>
);

const CommunityGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M8 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm8 0a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 12zm-8 2c-3.31 0-6 1.79-6 4v1.25A1.75 1.75 0 0 0 3.75 21h8.5A1.75 1.75 0 0 0 14 19.25V18c0-2.21-2.69-4-6-4zm8 1c-1.05 0-2.03.21-2.88.58A5.96 5.96 0 0 1 15 18v1.25c0 .27-.04.52-.1.75h5.35A1.75 1.75 0 0 0 22 18.25V18c0-1.66-2.69-3-6-3z" />
  </svg>
);

const ProfileGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 12a4.75 4.75 0 1 0-4.75-4.75A4.75 4.75 0 0 0 12 12zm0 2.25c-4 0-7.25 2.35-7.25 5.25A1.5 1.5 0 0 0 6.25 21h11.5a1.5 1.5 0 0 0 1.5-1.5c0-2.9-3.25-5.25-7.25-5.25z" />
  </svg>
);

const BottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const items = [
    { to: '/', label: t('nav_home'), icon: HomeGlyph },
    { to: '/shop', label: t('nav_shop'), icon: ShopGlyph },
    { to: '/community', label: t('nav_community'), icon: CommunityGlyph },
    { to: isAuthenticated ? '/profile' : '/login', label: t('nav_profile'), icon: ProfileGlyph },
  ];

  return (
    <nav
      className="fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-0.8rem)] max-w-[28rem] rounded-full border border-white/20 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 px-2 py-1.5 shadow-lg backdrop-blur-xl md:hidden transition-transform duration-300 ease-in-out ${
          scrollDirection === 'down' && !isAtTop ? 'translate-y-[150%] -translate-x-1/2' : 'translate-y-0 -translate-x-1/2'
        }"
      aria-label="Mobile bottom navigation"
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={`group relative isolate flex min-h-[48px] flex-col items-center justify-center rounded-full px-1 py-1 text-[11px] font-semibold transition-all duration-300 active:scale-95 ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-500'
                    : 'text-zinc-500 dark:text-zinc-300 hover:bg-amber-50/80 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="absolute inset-0 -z-10 rounded-2xl border border-kw-primary/20 bg-amber-500/10 dark:bg-amber-500/10 shadow-inner"
                    transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.55 }}
                    aria-hidden="true"
                  />
                )}
                {isActive && (
                  <span
                    className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-600"
                    aria-hidden="true"
                  />
                )}
                <Icon className={`mb-1 h-5 w-5 transition-transform duration-300 ${isActive ? 'animate-badge-pop' : 'group-hover:-translate-y-0.5'}`} />
                <span className="truncate px-1">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default React.memo(BottomNav);
