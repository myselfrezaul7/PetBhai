import React, { useState, useRef, useEffect, useCallback, useDeferredValue, useMemo } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon } from './icons';
import Logo from './Logo';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import SearchResults, { type SearchResultsData } from './SearchResults';
import { useProducts } from '../contexts/ProductContext';
import { useArticles } from '../contexts/ArticleContext';
import { useVets } from '../contexts/VetContext';
import { useAnimals } from '../contexts/AnimalContext';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeInput } from '../lib/security';
import { useGlobalSearch, type PageResult } from '../hooks/useGlobalSearch';
import { useCart } from '../contexts/CartContext';

// Extracted outside Header to prevent re-creation on every render
const MobileNavLink: React.FC<{
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = React.memo(({ to, children, icon, className, onClick, style }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={style}
    className={({ isActive }) =>
      `flex min-h-[56px] items-center gap-4 rounded-2xl border px-4 py-3 text-left text-[1.15rem] transition-all touch-manipulation ${
        isActive
          ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200/80 dark:border-blue-700/60 font-semibold shadow-[0_8px_24px_rgba(37,99,235,0.18)]'
          : 'bg-white/60 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-white/70 dark:border-slate-700/70 hover:bg-white/90 dark:hover:bg-slate-800/90'
      } ${className || ''}`
    }
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-current dark:bg-slate-800/80">
      {icon}
    </span>
    {children}
  </NavLink>
));
MobileNavLink.displayName = 'MobileNavLink';

const ALL_PAGES: PageResult[] = [
  { name: 'Home', path: '/', keywords: ['home', 'bari', 'বাড়ি', 'নীড়', 'hom'] },
  {
    name: 'Shop',
    path: '/shop',
    keywords: ['shop', 'store', 'market', 'kenakata', 'dokan', 'দোকান', 'কেনাকাটা'],
  },
  {
    name: 'Services',
    path: '/services',
    keywords: ['services', 'vet', 'doctor', 'grooming', 'seba', 'সেবা', 'ডাক্তার'],
  },
  {
    name: 'Community Hub',
    path: '/community',
    keywords: ['community', 'social', 'forum', 'group', 'kormoshala', 'কমিউনিটি', 'আড্ডা'],
  },
  {
    name: 'Blog',
    path: '/blog',
    keywords: ['blog', 'news', 'tips', 'articles', 'lekha', 'ব্লগ', 'লেখা'],
  },
  {
    name: 'PetBhai+',
    path: '/plus-membership',
    keywords: ['plus', 'premium', 'membership', 'vip', 'member', 'সদস্য'],
  },
];

const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

const isAdminUser = (user?: { role?: string; email?: string }): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.email?.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
};

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { products } = useProducts();
  const { articles } = useArticles();
  const { vets } = useVets();
  const { animals } = useAnimals();
  const { t, language, toggleLanguage } = useLanguage();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchAnnouncement, setSearchAnnouncement] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('petbhai_recent_searches');
      const parsed = saved ? (JSON.parse(saved) as unknown) : [];
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === 'string') as string[]) : [];
    } catch {
      return [];
    }
  });

  const deferredQuery = useDeferredValue(searchQuery);
  const computedResults = useGlobalSearch({
    query: deferredQuery,
    products,
    pages: ALL_PAGES,
    articles,
    vets,
    animals,
  });

  const searchResults: SearchResultsData = useMemo(
    () => ({
      products: computedResults.products,
      pages: computedResults.pages,
      vets: computedResults.vets,
      articles: computedResults.articles,
      animals: computedResults.animals,
    }),
    [computedResults]
  );

  const isSearching =
    searchQuery.trim().length >= 2 &&
    deferredQuery.trim().length >= 2 &&
    deferredQuery !== searchQuery;

  const handleLogout = useCallback(() => {
    logout();
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/');
  }, [logout, navigate]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef, searchRef]);

  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 5);
      localStorage.setItem('petbhai_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    setActiveIndex(-1);

    const effectiveQuery = deferredQuery.trim();
    if (effectiveQuery.length < 2) {
      setSearchAnnouncement('');
      return;
    }

    if (isSearching) {
      setSearchAnnouncement(t('search_searching'));
      return;
    }

    const totalResults =
      searchResults.products.length +
      searchResults.pages.length +
      searchResults.vets.length +
      searchResults.articles.length +
      searchResults.animals.length;

    if (totalResults > 0) {
      setSearchAnnouncement(`${totalResults} ${t('search_results_found')}`);
    } else {
      setSearchAnnouncement(`${t('search_no_results')} "${effectiveQuery}"`);
    }
  }, [deferredQuery, isSearching, searchResults, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchActive) return;

    const totalResults =
      searchResults.pages.length +
      searchResults.products.length +
      searchResults.vets.length +
      searchResults.animals.length +
      searchResults.articles.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        const allResults = [
          ...searchResults.pages.map((p) => ({ path: p.path })),
          ...searchResults.products.map((p) => ({ path: `/product/${p.id}` })),
          ...searchResults.vets.map((v) => ({ path: `/vet/${v.id}` })),
          ...searchResults.animals.map((a) => ({ path: `/adopt/${a.id}` })),
          ...searchResults.articles.map((a) => ({ path: `/blog/${a.id}` })),
        ];
        const selected = allResults[activeIndex];
        if (selected) {
          addToRecentSearches(searchQuery);
          navigate(selected.path);
          closeSearchResults();
        }
      } else if (searchQuery.trim()) {
        addToRecentSearches(searchQuery);
        navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
        closeSearchResults();
      }
    } else if (e.key === 'Escape') {
      closeSearchResults();
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const body = document.body;
    const scrollY = window.scrollY;
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    return () => {
      body.style.overflow = previousStyles.overflow;
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.left = previousStyles.left;
      body.style.right = previousStyles.right;
      body.style.width = previousStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsSearchActive(false);
    setIsProfileMenuOpen(false);
    setActiveIndex(-1);
  }, [location.pathname]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize search input to prevent XSS
    const sanitized = sanitizeInput(e.target.value);
    setSearchQuery(sanitized);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const closeSearchResults = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }, []);

  const handleOpenMobileSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(true);
    setIsSearchActive(true);
  }, []);

  const handleCloseMobileSearch = useCallback(() => {
    setIsSearchOpen(false);
    setIsSearchActive(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }, []);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      setIsMenuOpen(false);
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [location.pathname]
  );

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleProfileMenuToggle = useCallback(() => {
    setIsProfileMenuOpen((prev) => !prev);
  }, []);

  const desktopLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/shop', label: t('nav_shop') },
    { to: '/community', label: t('nav_community') },
    { to: '/adopt', label: 'Adopt' },
    { to: '/services', label: t('nav_services') },
    { to: '/blog', label: t('nav_blog') },
    {
      to: '/plus-membership',
      label: t('nav_plus'),
    },
  ];

  const mobileLinks = [
    {
      to: '/',
      label: t('nav_home'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3.2 3 10.4V21h6.75v-6h4.5v6H21V10.4l-9-7.2z" />
        </svg>
      ),
    },
    {
      to: '/shop',
      label: t('nav_shop'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2.75A1.75 1.75 0 0 0 4.25 4.5V7H3a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-1.25V4.5A1.75 1.75 0 0 0 18 2.75H6zm.25 4.25V4.75h11.5V7H6.25zm4.25 3h3a1 1 0 0 1 0 2h-3a1 1 0 1 1 0-2z" />
        </svg>
      ),
    },
    {
      to: '/services',
      label: t('nav_services'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8h-1V6a1 1 0 0 0-1-1h-2V4a1 1 0 1 0-2 0v1h-2V4a1 1 0 1 0-2 0v1H7a1 1 0 0 0-1 1v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM8 7h8v1H8V7zm4 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
      ),
    },
    {
      to: '/community',
      label: t('nav_community'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm8 0a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 12zm-8 2c-3.31 0-6 1.79-6 4v1.25A1.75 1.75 0 0 0 3.75 21h8.5A1.75 1.75 0 0 0 14 19.25V18c0-2.21-2.69-4-6-4zm8 1c-1.05 0-2.03.21-2.88.58A5.96 5.96 0 0 1 15 18v1.25c0 .27-.04.52-.1.75h5.35A1.75 1.75 0 0 0 22 18.25V18c0-1.66-2.69-3-6-3z" />
        </svg>
      ),
    },
    {
      to: '/adopt',
      label: 'Adoption',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 0 1 12 5.08 5.5 5.5 0 0 1 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
        </svg>
      ),
    },
    {
      to: '/blog',
      label: t('nav_blog'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h6v-2H7z" />
        </svg>
      ),
    },
    {
      to: '/report',
      label: 'Contact',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 3-8 5L4 7V6l8 5 8-5z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300">
        <nav className="w-full max-w-6xl flex items-center justify-between gap-2 p-1.5 pl-3 pr-2 sm:pl-4 sm:pr-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-full shadow-sm transition-all duration-300">
          
          {/* Logo Section */}
          <NavLink
            to="/"
            onClick={handleLogoClick}
            className="hidden lg:flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white flex-shrink-0 transition-opacity hover:opacity-80"
          >
            <Logo className="h-8 w-8 sm:h-9 sm:w-9" />
            <span className="hidden sm:inline text-lg font-black tracking-[0.08em] text-slate-900 dark:text-white">
              PETBHAI
            </span>
          </NavLink>

          {/* Desktop Menu - Centered */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4 xl:px-8">
            <ul className="flex items-center space-x-4 xl:space-x-6">
              {desktopLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `text-[0.78rem] xl:text-sm uppercase tracking-[0.14em] font-semibold transition-colors ${
                        isActive
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      } ${link.className || ''}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Actions: Search, Theme, Language, Profile */}
          <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
            
            {/* Search (Collapsible on Desktop for clean look) */}
            <div className="relative group flex items-center" ref={searchRef}>
              <div className={`flex items-center transition-all duration-300 ${isSearchActive || searchQuery ? 'w-44 sm:w-56 lg:w-52 xl:w-60 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700' : 'w-8 bg-transparent'}`}>
                  <SearchIcon 
                    className={`w-4 h-4 text-slate-500 cursor-pointer ${isSearchActive || searchQuery ? 'mr-2' : ''}`} 
                    onClick={() => {
                      if (!isSearchActive) {
                        setIsSearchActive(true);
                        setTimeout(() => desktopInputRef.current?.focus(), 100);
                      }
                    }}
                  />
                  <input
                    ref={desktopInputRef}
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleKeyDown}
                    className={`bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full ${isSearchActive || searchQuery ? 'block' : 'hidden'}`}
                  />
               </div>

              {/* Search Results Dropdown */}
              {isSearchActive && (
                <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-in origin-top-right z-50">
                   {searchQuery.length >= 2 ? (
                    <SearchResults
                      id="search-results-desktop"
                      query={deferredQuery}
                      results={searchResults}
                      loading={isSearching}
                      onClose={closeSearchResults}
                      activeIndex={activeIndex}
                    />
                  ) : (
                    recentSearches.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-3 pt-2">
                          {t('search_recent')}
                        </div>
                        {recentSearches.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSearchQuery(s)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-2 transition-colors"
                          >
                            <SearchIcon className="w-3 h-3 opacity-50" />
                            <span>{s}</span>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="w-10 h-10 flex items-center justify-center rounded-2xl text-[11px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label={language === 'en' ? 'Switch to Bengali' : 'Switch to English'}
            >
              {language === 'en' ? 'BN' : 'EN'}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle mode="icon" className="h-10 w-10 rounded-2xl" />

            {/* User Profile / Login */}
            {isAuthenticated && currentUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={handleProfileMenuToggle}
                  className="flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-transparent hover:ring-orange-500/50 transition-all p-0.5 overflow-hidden"
                  aria-label="Open user menu"
                >
                   <Avatar
                      src={currentUser.profilePictureUrl}
                      name={currentUser.name}
                      size="sm"
                      showPlusBadge={false} // Small size, hide badge
                    />
                </button>
                 {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl z-50 p-2 border border-white/20 dark:border-slate-800 animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate">
                        Hi, {currentUser.name.split(' ')[0]}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors bg-orange-50/50 dark:bg-slate-700/30 font-semibold"
                    >
                      My Pet Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {t('nav_profile')}
                    </Link>
                    {isAdminUser(currentUser) && (
                      <Link
                        to="/admin-dashboard"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <NavLink
                  to="/login"
                  className="font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t('nav_login')}
                </NavLink>
                <NavLink
                  to="/signup"
                  className="bg-slate-950 text-white font-bold py-2.5 px-5 rounded-full hover:bg-black transition-all active:scale-95"
                >
                  {t('nav_signup')}
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Header Layout */}
          <div className="flex w-full items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={handleMenuOpen}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation active:scale-95"
              aria-label="Open menu"
            >
              <MenuIcon className="w-7 h-7" />
            </button>

            <NavLink
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-300"
            >
              <Logo className="h-7 w-7" />
              <span className="text-2xl font-black tracking-tight">PetBhai</span>
            </NavLink>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleOpenMobileSearch}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation active:scale-95"
                aria-label="Open search"
              >
                <SearchIcon className="w-6 h-6" />
              </button>
              {isAuthenticated && currentUser ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-blue-100 dark:ring-blue-900"
                  aria-label="Open profile"
                >
                  <Avatar
                    src={currentUser.profilePictureUrl}
                    name={currentUser.name}
                    size="sm"
                    showPlusBadge={false}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCart}
                  className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation active:scale-95"
                  aria-label={`Open cart with ${cartCount} items`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Full-screen Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 lg:hidden animate-fade-in">
          <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </span>
              <input
                ref={mobileInputRef}
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onKeyDown={handleKeyDown}
                className="w-full py-3 pl-10 pr-4 text-base text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Search"
                autoFocus
                autoComplete="off"
                inputMode="search"
                enterKeyHint="search"
              />
            </div>
            <button
              type="button"
              onClick={handleCloseMobileSearch}
              className="ml-3 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-600 dark:text-slate-400 hover:text-orange-500 touch-manipulation active:scale-95"
              aria-label="Close search"
            >
              <CloseIcon className="w-7 h-7" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto">
            {searchQuery.length >= 2 ? (
              <SearchResults
                id="search-results-mobile"
                query={deferredQuery}
                results={searchResults}
                loading={isSearching}
                onClose={handleCloseMobileSearch}
                activeIndex={activeIndex}
                isFullScreen={true}
              />
            ) : (
              recentSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase">Recent Searches</h3>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('petbhai_recent_searches');
                      }}
                      className="text-xs text-red-500 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(s);
                          mobileInputRef.current?.focus();
                        }}
                        className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 flex items-center space-x-3 active:scale-[0.98] transition-all"
                      >
                        <SearchIcon className="w-4 h-4 opacity-50" />
                        <span className="font-medium">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <button
          type="button"
          onClick={handleMenuClose}
          className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close menu backdrop"
        />

        <aside
          className={`safe-top safe-bottom relative h-full w-[86%] max-w-sm rounded-r-[2.2rem] border-r border-white/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(236,243,255,0.92))] px-5 py-5 shadow-[0_26px_64px_rgba(30,64,175,0.2)] backdrop-blur-glass transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-slate-700/70 dark:bg-[linear-gradient(160deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92))] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[2.35rem] font-black leading-none tracking-tight text-blue-700 dark:text-blue-300">
              PetBhai
            </h2>
            <button
              type="button"
              onClick={handleMenuClose}
              className="min-h-[44px] min-w-[44px] rounded-full text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              aria-label="Close menu"
            >
              <CloseIcon className="h-8 w-8" />
            </button>
          </div>

          <div className="mb-6 rounded-3xl border border-white/80 bg-white/70 p-4 backdrop-blur-md shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/75">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-blue-400/60 bg-white shadow-sm dark:bg-slate-800">
                {isAuthenticated && currentUser ? (
                  <Avatar
                    src={currentUser.profilePictureUrl}
                    name={currentUser.name}
                    size="md"
                    showPlusBadge={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                    PetBhai
                  </div>
                )}
              </div>
              <div>
                <p className="max-w-[11rem] truncate text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
                  {isAuthenticated && currentUser ? currentUser.name : 'Guardian Name'}
                </p>
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                  {isAuthenticated ? 'Premium Member' : 'Pet Parent'}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-3 pb-4">
            {mobileLinks.map((link, index) => (
              <MobileNavLink
                key={link.to}
                to={link.to}
                onClick={handleMenuClose}
                icon={link.icon}
                style={{ transitionDelay: isMenuOpen ? `${80 + index * 55}ms` : '0ms' }}
                className={`transform-gpu duration-300 ease-out ${
                  isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}
              >
                {link.label}
              </MobileNavLink>
            ))}
          </nav>

          <div className="mt-5 space-y-3">
            <Link
              to={isAuthenticated ? '/profile' : '/login'}
              onClick={handleMenuClose}
              className="flex min-h-[56px] items-center gap-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-[1.15rem] font-medium text-slate-700 transition-colors hover:bg-white/90 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 10c-3.31 0-6 1.79-6 4v1h12v-1c0-2.21-2.69-4-6-4z" />
                </svg>
              </span>
              Settings
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-[56px] w-full items-center gap-4 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-[1.15rem] font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3zm8.71 8.29-2-2-1.42 1.42L16.59 12H9v2h7.59l-1.3 1.29 1.42 1.42 2-2a1 1 0 0 0 0-1.42z" />
                  </svg>
                </span>
                {t('nav_logout')}
              </button>
            ) : (
              <Link
                to="/signup"
                onClick={handleMenuClose}
                className="flex min-h-[56px] items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-[1.15rem] font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
              >
                {t('nav_signup')}
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="min-h-[44px] w-full rounded-xl border border-white/80 bg-white/60 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                aria-label={language === 'en' ? 'Switch to Bengali' : 'Switch to English'}
              >
                {language === 'en' ? 'Language: BN' : 'Language: EN'}
              </button>
              <ThemeToggle mode="labeled" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default React.memo(Header);
