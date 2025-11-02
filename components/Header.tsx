import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon, UserIcon } from './icons';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { MOCK_PRODUCTS } from '../constants';
import SearchResults, { type SearchResultsData } from './SearchResults';

interface PageResult {
  name: string;
  path: string;
}

const ALL_PAGES: PageResult[] = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Services', path: '/services' },
    { name: 'Community Hub', path: '/community' },
    { name: 'AI Vet', path: '/ai-assistant' },
    { name: 'Blog', path: '/blog' },
    { name: 'PetBhai+', path: '/plus-membership' },
];

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
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
  
  const activeLinkClass = 'text-orange-500 dark:text-orange-400 font-semibold';
  const inactiveLinkClass = 'text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-500';
  
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

        const filteredProducts = MOCK_PRODUCTS.filter(product =>
            product.name.toLowerCase().includes(lowerCaseQuery) ||
            product.category.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 4);
        
        const filteredPages = ALL_PAGES.filter(page =>
            page.name.toLowerCase().includes(lowerCaseQuery)
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
  }, [searchQuery]);

  // Lock body scroll when mobile menu is open for better UX
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset scroll on component unmount
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


  const MobileNavLink: React.FC<{ to: string, children: React.ReactNode, className?: string }> = ({ to, children, className }) => (
    <NavLink 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) => `block py-3 text-2xl text-center ${isActive ? 'text-orange-500 font-bold' : 'text-slate-700 dark:text-slate-200 font-medium'} ${className}`}
    >
        {children}
    </NavLink>
  );

  const DesktopNavLink: React.FC<{ to: string, children: React.ReactNode, className?: string }> = ({ to, children, className }) => (
    <li><NavLink to={to} className={({ isActive }) => `${(isActive ? activeLinkClass : inactiveLinkClass)} ${className}`}>{children}</NavLink></li>
  );

  return (
    <>
      <header className="bg-white/30 dark:bg-slate-900/30 shadow-md sticky top-0 z-20 backdrop-blur-lg border-b border-white/20 dark:border-slate-700/30">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <NavLink to="/" className={`flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white flex-shrink-0 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <Logo className="w-10 h-10 text-orange-500" />
            <span className="sm:inline">PetBhai</span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            <ul className="flex items-center space-x-6 text-[15px] font-medium">
                <DesktopNavLink to="/">Home</DesktopNavLink>
                <DesktopNavLink to="/shop">Shop</DesktopNavLink>
                <DesktopNavLink to="/community">Community</DesktopNavLink>
                <DesktopNavLink to="/services">Services</DesktopNavLink>
                <DesktopNavLink to="/ai-assistant">AI Vet</DesktopNavLink>
                <DesktopNavLink to="/blog">Blog</DesktopNavLink>
                <DesktopNavLink to="/plus-membership" className="text-yellow-600 dark:text-yellow-400 font-bold">PetBhai+</DesktopNavLink>
            </ul>
          </div>
           {/* Search Bar & Profile */}
           <div className="hidden lg:flex items-center space-x-4">
                <div className="relative" ref={searchRef}>
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    className="w-48 py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                    aria-label="Search"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={isSearchActive && !!searchQuery}
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    aria-controls="search-results-desktop"
                />
                {isSearchActive && searchQuery && (
                    <SearchResults 
                        id="search-results-desktop"
                        query={searchQuery}
                        results={searchResults}
                        loading={isSearching}
                        onClose={closeSearchResults}
                    />
                )}
                </div>
            
                <ThemeToggle />

                {isAuthenticated && currentUser ? (
                    <div className="relative" ref={profileMenuRef}>
                        <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="relative flex items-center space-x-2">
                            {currentUser.profilePictureUrl ? (
                                <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                                </div>
                            )}
                            {currentUser.isPlusMember && (
                               <span className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                                +
                               </span>
                            )}
                        </button>
                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-20 py-2 border border-slate-200 dark:border-slate-700">
                                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Hi, {currentUser.name.split(' ')[0]}</p>
                                </div>
                                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">My Profile</Link>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <NavLink to="/login" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500">Login</NavLink>
                        <NavLink to="/signup" className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105">Sign Up</NavLink>
                    </>
                )}
            </div>

          {/* Mobile Menu Button & Search Toggle */}
          <div className={`lg:hidden flex items-center ${isSearchOpen ? 'flex-grow' : ''}`}>
             {isSearchOpen ? (
                <div className="w-full flex items-center" ref={searchRef}>
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            className="w-full py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                            <SearchResults 
                                id="search-results-mobile"
                                query={searchQuery}
                                results={searchResults}
                                loading={isSearching}
                                onClose={closeSearchResults}
                            />
                        )}
                    </div>
                    <button onClick={handleCloseMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 ml-2 p-1" aria-label="Close search">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                    <button onClick={handleOpenMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500" aria-label="Open search">
                      <SearchIcon className="w-7 h-7" />
                    </button>
                    <button onClick={() => setIsMenuOpen(true)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500" aria-label="Open menu">
                      <MenuIcon className="w-8 h-8" />
                    </button>
                </div>
            )}
          </div>
        </nav>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-lg z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden flex flex-col`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
           <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500" aria-label="Close menu">
              <CloseIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center flex-grow overflow-y-auto py-8">
            <nav className="flex flex-col space-y-6">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/shop">Shop</MobileNavLink>
                <MobileNavLink to="/community">Community</MobileNavLink>
                <MobileNavLink to="/services">Services</MobileNavLink>
                <MobileNavLink to="/ai-assistant">AI Vet</MobileNavLink>
                <MobileNavLink to="/blog">Blog</MobileNavLink>
                <MobileNavLink to="/plus-membership" className="text-yellow-600 dark:text-yellow-400 !font-bold">PetBhai+</MobileNavLink>
            </nav>
            <div className="mt-12 w-full px-8">
              {isAuthenticated && currentUser ? (
                  <div className="text-center">
                       <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="relative flex flex-col items-center space-y-2 mb-6">
                           {currentUser.profilePictureUrl ? (
                                <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover" />
                           ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-12 h-12 text-slate-500 dark:text-slate-300" />
                                </div>
                           )}
                           {currentUser.isPlusMember && (
                                <span className="absolute top-14 right-[calc(50%-55px)] bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold ring-2 ring-white dark:ring-slate-800">
                                +
                               </span>
                           )}
                           <p className="font-semibold text-slate-700 dark:text-slate-200 text-xl">Hi, {currentUser.name.split(' ')[0]}</p>
                           <p className="text-sm text-orange-600">View Profile</p>
                       </Link>
                      <button onClick={handleLogout} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">Logout</button>
                  </div>
              ) : (
                  <div className="flex flex-col space-y-4">
                      <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center font-bold text-slate-700 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-600 py-3 px-5 rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-slate-800">Login</NavLink>
                      <NavLink to="/signup" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-orange-500 text-white font-bold py-3 px-5 rounded-lg text-lg hover:bg-orange-600">Sign Up</NavLink>
                  </div>
              )}
            </div>
        </div>
      </div>
      <div role="status" className="sr-only" aria-live="polite">
        {searchAnnouncement}
      </div>
    </>
  );
};

export default Header;