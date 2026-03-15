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
  className?: string;
  onClick?: () => void;
}> = React.memo(({ to, children, className, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block min-h-[44px] py-3 px-4 rounded-2xl border text-base sm:text-lg text-center transition-all touch-manipulation ${
        isActive
          ? 'text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm'
          : 'text-slate-700 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      } ${className || ''}`
    }
  >
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300">
        <nav className="w-full max-w-6xl flex items-center justify-between gap-2 p-1.5 pl-3 pr-2 sm:pl-4 sm:pr-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-full shadow-sm transition-all duration-300">
          
          {/* Logo Section */}
          <NavLink
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white flex-shrink-0 transition-opacity hover:opacity-80"
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

          {/* Mobile Menu Button & Search Toggle */}
          <div className="lg:hidden flex items-center">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={openCart}
                className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors touch-manipulation active:scale-95"
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
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenMobileSearch}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors touch-manipulation active:scale-95"
                aria-label="Open search"
              >
                <SearchIcon className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleMenuOpen}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors touch-manipulation active:scale-95"
                aria-label="Open menu"
              >
                <MenuIcon className="w-7 h-7" />
              </button>
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

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl saturate-150 z-50 transform ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="safe-top container mx-auto px-4 md:px-6 py-4 flex justify-between items-center flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
          <NavLink
            to="/"
            onClick={handleLogoClick}
            className="flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white touch-manipulation"
          >
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <button
            type="button"
            onClick={handleMenuClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-transform touch-manipulation"
            aria-label="Close menu"
          >
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto py-6 overscroll-contain">
          <nav className="flex flex-col space-y-3 w-full px-6 sm:px-8">
            <MobileNavLink to="/" onClick={handleMenuClose}>
              {t('nav_home')}
            </MobileNavLink>
            <MobileNavLink to="/shop" onClick={handleMenuClose}>
              {t('nav_shop')}
            </MobileNavLink>
            <MobileNavLink to="/community" onClick={handleMenuClose}>
              {t('nav_community')}
            </MobileNavLink>
            <MobileNavLink to="/adopt" onClick={handleMenuClose}>
              Adopt
            </MobileNavLink>
            <MobileNavLink to="/services" onClick={handleMenuClose}>
              {t('nav_services')}
            </MobileNavLink>
            <MobileNavLink to="/blog" onClick={handleMenuClose}>
              {t('nav_blog')}
            </MobileNavLink>
            <MobileNavLink
              to="/plus-membership"
              onClick={handleMenuClose}
              className="text-yellow-600 dark:text-yellow-400 font-bold"
            >
              {t('nav_plus')}
            </MobileNavLink>
          </nav>

          <div className="mt-8 flex flex-col space-y-3 w-full px-6 sm:px-8">
            {isAuthenticated && currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base border border-slate-200 dark:border-slate-700"
                >
                  My Pet Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base"
                >
                  {t('nav_profile')}
                </Link>
                {isAdminUser(currentUser) && (
                  <Link
                    to="/admin-dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base border border-slate-200 dark:border-slate-700"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-base"
                >
                  {t('nav_logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-base"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full min-h-[44px] text-center py-3 rounded-2xl bg-slate-950 text-white font-bold text-base shadow-sm"
                >
                  {t('nav_signup')}
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 w-full px-6 sm:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Settings
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="min-h-[44px] w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-transform touch-manipulation"
                  aria-label={language === 'en' ? 'Switch to Bengali' : 'Switch to English'}
                >
                  {language === 'en' ? 'Language: BN' : 'Language: EN'}
                </button>
                <ThemeToggle mode="labeled" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(Header);
