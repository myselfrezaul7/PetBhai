import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon, UserIcon } from './icons';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import SearchResults, { type SearchResultsData } from './SearchResults';
import { useProducts } from '../contexts/ProductContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PageResult {
  name: string;
  path: string;
  keywords: string[];
}

const ALL_PAGES: PageResult[] = [
    { name: 'Home', path: '/', keywords: ['home', 'bari', 'বাড়ি', 'নীড়', 'hom'] },
    { name: 'Shop', path: '/shop', keywords: ['shop', 'store', 'market', 'kenakata', 'dokan', 'দোকান', 'কেনাকাটা'] },
    { name: 'Services', path: '/services', keywords: ['services', 'vet', 'doctor', 'grooming', 'seba', 'সেবা', 'ডাক্তার'] },
    { name: 'Community Hub', path: '/community', keywords: ['community', 'social', 'forum', 'group', 'kormoshala', 'কমিউনিটি', 'আড্ডা'] },
    { name: 'AI Vet', path: '/ai-assistant', keywords: ['ai', 'vet', 'assistant', 'chat', 'bot', 'krimtim', 'buddhimotta', 'এআই', 'চ্যাট'] },
    { name: 'Blog', path: '/blog', keywords: ['blog', 'news', 'tips', 'articles', 'lekha', 'ব্লগ', 'লেখা'] },
    { name: 'PetBhai+', path: '/plus-membership', keywords: ['plus', 'premium', 'membership', 'vip', 'member', 'সদস্য'] },
];

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { products } = useProducts();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultsData>({ products: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchAnnouncement, setSearchAnnouncement] = useState('');
  
  const activeLinkClass = 'text-orange-500 dark:text-orange-400 font-bold';
  const inactiveLinkClass = 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors';
  
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/');
  };
  
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef, searchRef]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
        setSearchResults({ products: [], pages: [] });
        setIsSearching(false);
        setSearchAnnouncement('');
        return;
    }

    setIsSearching(true);
    setSearchAnnouncement('Searching...');

    const handler = setTimeout(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();

        const filteredProducts = products.filter(product => {
            const query = lowerCaseQuery;
            const nameMatch = product.name.toLowerCase().includes(query);
            const categoryMatch = product.category.toLowerCase().includes(query);
            const tagMatch = product.searchTags?.some(tag => tag.toLowerCase().includes(query));
            return nameMatch || categoryMatch || tagMatch;
        }).slice(0, 4);
        
        const filteredPages = ALL_PAGES.filter(page =>
            page.name.toLowerCase().includes(lowerCaseQuery) ||
            page.keywords.some(k => k.toLowerCase().includes(lowerCaseQuery))
        ).slice(0, 3);
        
        const totalResults = filteredProducts.length + filteredPages.length;

        setSearchResults({
            products: filteredProducts,
            pages: filteredPages,
        });

        if (totalResults > 0) {
            setSearchAnnouncement(`${totalResults} results found.`);
        } else {
            setSearchAnnouncement(`No results found for "${searchQuery}"`);
        }

        setIsSearching(false);
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [searchQuery, products]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };

  const closeSearchResults = () => {
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const handleOpenMobileSearch = () => {
      setSearchQuery('');
      setIsSearchOpen(true);
      setIsSearchActive(true);
  };

  const handleCloseMobileSearch = () => {
      setIsSearchOpen(false);
      closeSearchResults();
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const MobileNavLink: React.FC<{ to: string, children: React.ReactNode, className?: string }> = ({ to, children, className }) => (
    <NavLink 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) => `block py-3 text-2xl text-center transition-colors ${isActive ? 'text-orange-500 font-bold' : 'text-slate-700 dark:text-slate-200 font-medium hover:text-orange-500'} ${className}`}
    >
        {children}
    </NavLink>
  );

  const DesktopNavLink: React.FC<{ to: string, children: React.ReactNode, className?: string }> = ({ to, children, className }) => (
    <li><NavLink to={to} className={({ isActive }) => `${(isActive ? activeLinkClass : inactiveLinkClass)} ${className}`}>{children}</NavLink></li>
  );

  return (
    <>
      <header className="bg-white/60 dark:bg-slate-900/60 shadow-lg sticky top-0 z-40 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 transition-colors duration-300">
        <nav className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <NavLink to="/" onClick={handleLogoClick} className={`flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white flex-shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <Logo className="w-10 h-10 text-orange-500" />
            <span className="sm:inline tracking-tight uppercase">PetBhai</span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <ul className="flex items-center space-x-8 text-[15px]">
                <DesktopNavLink to="/">{t('nav_home')}</DesktopNavLink>
                <DesktopNavLink to="/shop">{t('nav_shop')}</DesktopNavLink>
                <DesktopNavLink to="/community">{t('nav_community')}</DesktopNavLink>
                <DesktopNavLink to="/services">{t('nav_services')}</DesktopNavLink>
                <DesktopNavLink to="/ai-assistant">{t('nav_ai_vet')}</DesktopNavLink>
                <DesktopNavLink to="/blog">{t('nav_blog')}</DesktopNavLink>
                <DesktopNavLink to="/plus-membership" className="text-yellow-600 dark:text-yellow-400 font-bold hover:text-yellow-700 dark:hover:text-yellow-300">{t('nav_plus')}</DesktopNavLink>
            </ul>
          </div>
           {/* Search Bar & Profile */}
           <div className="hidden lg:flex items-center space-x-5">
                <div className="relative group" ref={searchRef}>
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    </span>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        className="w-48 focus:w-64 transition-all duration-300 ease-out py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-900 shadow-inner"
                        aria-label="Search"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isSearchActive && !!searchQuery}
                        aria-haspopup="listbox"
                        aria-autocomplete="list"
                        aria-controls="search-results-desktop"
                    />
                    {isSearchActive && searchQuery && (
                        <div className="animate-fade-in origin-top">
                            <SearchResults 
                                id="search-results-desktop"
                                query={searchQuery}
                                results={searchResults}
                                loading={isSearching}
                                onClose={closeSearchResults}
                            />
                        </div>
                    )}
                </div>
            
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={toggleLanguage} 
                        className="px-2.5 py-1 rounded-md text-sm font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95"
                    >
                        {language === 'en' ? 'BN' : 'EN'}
                    </button>
                    <ThemeToggle />
                </div>

                {isAuthenticated && currentUser ? (
                    <div className="relative" ref={profileMenuRef}>
                        <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="relative flex items-center space-x-2 focus:outline-none group">
                            <div className="ring-2 ring-transparent group-hover:ring-orange-500 rounded-full transition-all duration-200 p-0.5">
                                {currentUser.profilePictureUrl ? (
                                    <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                                    </div>
                                )}
                            </div>
                            {currentUser.isPlusMember && (
                               <span className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-800 shadow-sm animate-scale-in">
                                +
                               </span>
                            )}
                        </button>
                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-20 py-2 border border-slate-200 dark:border-slate-700 transform origin-top-right animate-scale-in">
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 mb-2">
                                    <p className="font-bold text-slate-800 dark:text-white">Hi, {currentUser.name.split(' ')[0]}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                                </div>
                                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">{t('nav_profile')}</Link>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">{t('nav_logout')}</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center space-x-4">
                        <NavLink to="/login" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">{t('nav_login')}</NavLink>
                        <NavLink to="/signup" className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full hover:bg-orange-600 transition-all transform hover:scale-105 shadow-md hover:shadow-lg active:scale-95">{t('nav_signup')}</NavLink>
                    </div>
                )}
            </div>

          {/* Mobile Menu Button & Search Toggle */}
          <div className={`lg:hidden flex items-center ${isSearchOpen ? 'flex-grow' : ''}`}>
             {isSearchOpen ? (
                <div className="w-full flex items-center animate-fade-in" ref={searchRef}>
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            className="w-full py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-label="Search"
                            autoFocus
                            autoComplete="off"
                            role="combobox"
                            aria-expanded={isSearchActive && !!searchQuery}
                            aria-haspopup="listbox"
                            aria-autocomplete="list"
                            aria-controls="search-results-mobile"
                        />
                         {isSearchActive && searchQuery && (
                            <div className="animate-fade-in origin-top">
                                <SearchResults 
                                    id="search-results-mobile"
                                    query={searchQuery}
                                    results={searchResults}
                                    loading={isSearching}
                                    onClose={closeSearchResults}
                                />
                            </div>
                        )}
                    </div>
                    <button onClick={handleCloseMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 ml-2 p-1" aria-label="Close search">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                    <button onClick={handleOpenMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors" aria-label="Open search">
                      <SearchIcon className="w-7 h-7" />
                    </button>
                    <button onClick={() => setIsMenuOpen(true)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors" aria-label="Open menu">
                      <MenuIcon className="w-8 h-8" />
                    </button>
                </div>
            )}
          </div>
        </nav>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) lg:hidden flex flex-col`}>
        <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
           <NavLink to="/" onClick={handleLogoClick} className="flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <div className="flex items-center space-x-4">
            <button 
                onClick={toggleLanguage} 
                className="px-3 py-1 rounded-md text-base font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
            >
                {language === 'en' ? 'BN' : 'EN'}
            </button>
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 active:scale-95 transition-transform" aria-label="Close menu">
              <CloseIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center flex-grow overflow-y-auto py-8">
            <nav className="flex flex-col space-y-6 w-full px-10">
                <MobileNavLink to="/">{t('nav_home')}</MobileNavLink>
                <MobileNavLink to="/shop">{t('nav_shop')}</MobileNavLink>
                <MobileNavLink to="/community">{t('nav_community')}</MobileNavLink>
                <MobileNavLink to="/services">{t('nav_services')}</MobileNavLink>
                <MobileNavLink to="/ai-assistant">{t('nav_ai_vet')}</MobileNavLink>
                <MobileNavLink to="/blog">{t('nav_blog')}</MobileNavLink>
                <MobileNavLink to="/plus-membership" className="text-yellow-600 dark:text-yellow-400 font-bold">{t('nav_plus')}</MobileNavLink>
            </nav>
            <div className="mt-10 flex flex-col space-y-4 w-full px-10">
                {isAuthenticated && currentUser ? (
                    <>
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-lg">{t('nav_profile')}</Link>
                        <button onClick={handleLogout} className="w-full text-center py-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-lg">{t('nav_logout')}</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-lg">{t('nav_login')}</Link>
                        <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-3 rounded-full bg-orange-500 text-white font-bold text-lg shadow-lg">{t('nav_signup')}</Link>
                    </>
                )}
            </div>
        </div>
      </div>
    </>
  );
};

export default Header;