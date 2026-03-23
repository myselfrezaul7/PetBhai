import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

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

  const items = [
    { to: '/', label: t('nav_home'), icon: HomeGlyph },
    { to: '/shop', label: t('nav_shop'), icon: ShopGlyph },
    { to: '/community', label: t('nav_community'), icon: CommunityGlyph },
    { to: isAuthenticated ? '/profile' : '/login', label: t('nav_profile'), icon: ProfileGlyph },
  ];

  return (
    <nav
      className="fixed bottom-2 left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-3xl border border-white/70 bg-white/88 px-2 py-2 shadow-[0_16px_42px_rgba(59,94,160,0.2)] backdrop-blur-glass dark:border-slate-700/70 dark:bg-slate-900/88 md:hidden"
      aria-label="Mobile bottom navigation"
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-[11px] font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-inner dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="mb-1 h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default React.memo(BottomNav);
