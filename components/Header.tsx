import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon, UserIcon } from './icons';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import { MOCK_ANIMALS, MOCK_PRODUCTS } from '../constants';
import SearchResults, { type SearchResultsData } from './SearchResults';

interface PageResult {
  name: string;
  path: string;
}

const ALL_PAGES: PageResult[] = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Online Vet', path: '/online-vet' },
    { name: 'Adopt a Pet', path: '/adopt' },
    { name: 'Community Hub', path: '/community' },
    { name: 'Report a Rescue', path: '/report' },
    { name: 'AI Vet Assistant', path: '/ai-assistant' },
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
  const [searchResults, setSearchResults] = useState<SearchResultsData>({ pets: [], products: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const activeLinkClass = 'text-orange-600 font-semibold';
  const inactiveLinkClass = 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500';
  
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
        setSearchResults({ pets: [], products: [], pages: [] });
        setIsSearching(false);
        return;
    }

    setIsSearching(true);

    const handler = setTimeout(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const filteredPets = MOCK_ANIMALS.filter(animal => 
            animal.name.toLowerCase().includes(lowerCaseQuery) ||
            animal.breed.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        const filteredProducts = MOCK_PRODUCTS.filter(product =>
            product.name.toLowerCase().includes(lowerCaseQuery) ||
            product.category.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);
        
        const filteredPages = ALL_PAGES.filter(page =>
            page.name.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        setSearchResults({
            pets: filteredPets,
            products: filteredProducts,
            pages: filteredPages,
        });
        setIsSearching(false);
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [searchQuery]);

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


  const MobileNavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => (
    <NavLink 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) => `block py-3 text-2xl text-center ${isActive ? 'text-orange-500 font-bold' : 'text-slate-700 dark:text-slate-200 font-medium'}`}
    >
        {children}
    </NavLink>
  );

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-900/80 shadow-sm sticky top-0 z-20 backdrop-blur-lg">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <NavLink to="/" className={`flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex items-center space-x-8 text-base font-medium">
              <li><NavLink to="/" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Home</NavLink></li>
              <li><NavLink to="/shop" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Shop</NavLink></li>
              <li><NavLink to="/online-vet" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Online Vet</NavLink></li>
              <li><NavLink to="/adopt" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Adopt</NavLink></li>
              <li><NavLink to="/community" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Community</NavLink></li>
              <li><NavLink to="/report" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Report Rescue</NavLink></li>
              <li><NavLink to="/ai-assistant" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>AI Assistant</NavLink></li>
            </ul>
             {/* Search Bar */}
            <div className="relative" ref={searchRef}>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Search for pets, products..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-64 py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                aria-label="Search"
                autoComplete="off"
              />
              {isSearchActive && searchQuery && (
                <SearchResults 
                    query={searchQuery}
                    results={searchResults}
                    loading={isSearching}
                    onClose={closeSearchResults}
                />
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated && currentUser ? (
                  <div className="relative" ref={profileMenuRef}>
                      <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center space-x-2">
                         {currentUser.profilePictureUrl ? (
                            <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                            </div>
                          )}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Hi, {currentUser.name.split(' ')[0]}</span>
                      </button>
                      {isProfileMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-20 py-2">
                              <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">My Profile</Link>
                              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Logout</button>
                          </div>
                      )}
                  </div>
              ) : (
                  <>
                      <NavLink to="/login" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500">Login</NavLink>
                      <NavLink to="/signup" className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105">Sign Up</NavLink>
                  </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button & Search Toggle */}
          <div className={`md:hidden flex items-center ${isSearchOpen ? 'flex-grow' : ''}`}>
             {isSearchOpen ? (
                <div className="w-full flex items-center" ref={searchRef}>
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            className="w-full py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                            aria-label="Search"
                            autoFocus
                            autoComplete="off"
                        />
                         {isSearchActive && searchQuery && (
                            <SearchResults 
                                query={searchQuery}
                                results={searchResults}
                                loading={isSearching}
                                onClose={closeSearchResults}
                            />
                        )}
                    </div>
                    <button onClick={handleCloseMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 ml-2 p-1">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                    <button onClick={handleOpenMobileSearch} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500">
                      <SearchIcon className="w-7 h-7" />
                    </button>
                    <button onClick={() => setIsMenuOpen(true)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500">
                      <MenuIcon className="w-8 h-8" />
                    </button>
                </div>
            )}
          </div>
        </nav>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white dark:bg-slate-900 z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden flex flex-col`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center flex-shrink-0">
           <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500">
              <CloseIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center flex-grow overflow-y-auto py-8">
            <nav className="flex flex-col space-y-6">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/shop">Shop</MobileNavLink>
                <MobileNavLink to="/online-vet">Online Vet</MobileNavLink>
                <MobileNavLink to="/adopt">Adopt</MobileNavLink>
                <MobileNavLink to="/community">Community</MobileNavLink>
                <MobileNavLink to="/report">Report Rescue</MobileNavLink>
                <MobileNavLink to="/ai-assistant">AI Assistant</MobileNavLink>
            </nav>
            <div className="mt-12 w-full px-8">
              {isAuthenticated && currentUser ? (
                  <div className="text-center">
                       <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center space-y-2 mb-6">
                           {currentUser.profilePictureUrl ? (
                                <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover" />
                           ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <UserIcon className="w-12 h-12 text-slate-500 dark:text-slate-300" />
                                </div>
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
    </>
  );
};

export default Header;