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

const BlogGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
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
  const { scrollDirection, isAtTop } = useScrollDirection();

  // Hide on pages that have their own sticky bottom bar
  const hideOnRoutes = ['/product/'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;

  const items = [
    { to: '/', label: t('nav_home'), icon: HomeGlyph },
    { to: '/shop', label: t('nav_shop'), icon: ShopGlyph },
    { to: '/blog', label: t('nav_blog'), icon: BlogGlyph },      
    { to: isAuthenticated ? '/profile' : '/login', label: t('nav_profile'), icon: ProfileGlyph },
  ];

  return (
    <nav
      className={`fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[24rem] rounded-full border border-white/30 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 px-2 py-2 shadow-xl backdrop-blur-xl md:hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrollDirection === 'down' && !isAtTop ? 'translate-y-[200%] opacity-0 -translate-x-1/2 scale-95' : 'translate-y-0 opacity-100 -translate-x-1/2 scale-100'
        }`}
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
                className={`group relative isolate flex min-h-[52px] flex-col items-center justify-between rounded-full px-1 py-1.5 text-[11px] font-semibold transition-all duration-300 active:scale-90 ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-amber-50/80 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-bottom-nav-active"
                    className="absolute inset-0 -z-10 rounded-full border border-amber-600/20 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                    aria-hidden="true"
                  />
                )}
                {isActive && (
                  <span
                    className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-500 shadow-sm"
                    aria-hidden="true"
                  />
                )}
                <Icon className={`mb-0.5 h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:-translate-y-0.5'}`} />
                <span className="truncate px-1 tracking-tight">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default React.memo(BottomNav);
