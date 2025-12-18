import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon, UserIcon, PhoneIcon, MailIcon } from './icons';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultsData>({ products: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const activeLinkClass = 'text-orange-500 dark:text-orange-400 font-bold';
  const inactiveLinkClass = 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors';
  
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/');
  };
  
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
        setSearchResults({ products: [], pages: [] });
        setIsSearching(false);
        return;
    }
    setIsSearching(true);
    const handler = setTimeout(() => {
        const query = searchQuery.toLowerCase();
        const filteredProducts = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 4);
        const filteredPages = ALL_PAGES.filter(p => p.name.toLowerCase().includes(query)).slice(0, 3);
        setSearchResults({ products: filteredProducts, pages: filteredPages });
        setIsSearching(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, products]);

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-white py-1.5 px-4 hidden md:block border-b border-white/5">
        <div className="container mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center space-x-6">
                <a href="tel:+880123456789" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                    <PhoneIcon className="w-3 h-3" />
                    Emergency Support: +880123456789
                </a>
                <a href="mailto:petbhaibd@gmail.com" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                    <MailIcon className="w-3 h-3" />
                    petbhaibd@gmail.com
                </a>
            </div>
            <div className="flex items-center space-x-4">
                <Link to="/faq" className="hover:text-orange-400">Help Center</Link>
                <Link to="/volunteer" className="text-orange-500 hover:text-orange-400">Join the Team</Link>
            </div>
        </div>
      </div>

      <header className="bg-white/60 dark:bg-slate-900/60 shadow-lg sticky top-0 z-40 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50 transition-colors duration-300">
        <nav className="container mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <NavLink to="/" className={`flex items-center space-x-2 text-2xl font-bold text-slate-800 dark:text-white transition-transform hover:scale-105 active:scale-95 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <Logo className="w-9 h-9 text-orange-500" />
            <span className="tracking-tight">PetBhai</span>
          </NavLink>

          <div className="hidden lg:flex items-center space-x-8">
            <ul className="flex items-center space-x-8 text-[15px]">
                <li><NavLink to="/" className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}>{t('nav_home')}</NavLink></li>
                <li><NavLink to="/shop" className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}>{t('nav_shop')}</NavLink></li>
                <li><NavLink to="/community" className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}>{t('nav_community')}</NavLink></li>
                <li><NavLink to="/services" className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}>{t('nav_services')}</NavLink></li>
                <li><NavLink to="/blog" className={({ isActive }) => isActive ? activeLinkClass : inactiveLinkClass}>{t('nav_blog')}</NavLink></li>
                <li><NavLink to="/plus-membership" className="text-yellow-600 dark:text-yellow-400 font-bold hover:text-yellow-700">PetBhai+</NavLink></li>
            </ul>
          </div>

          <div className="hidden lg:flex items-center space-x-5">
                <div className="relative group" ref={searchRef}>
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchActive(true)}
                        className="w-48 focus:w-64 transition-all py-2 pl-10 pr-4 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {isSearchActive && searchQuery && (
                        <SearchResults id="search-results-desktop" query={searchQuery} results={searchResults} loading={isSearching} onClose={() => setIsSearchActive(false)} />
                    )}
                </div>
            
                <button onClick={toggleLanguage} className="px-2.5 py-1 rounded-md text-sm font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-all">
                    {language === 'en' ? 'BN' : 'EN'}
                </button>
                <ThemeToggle />

                {isAuthenticated && currentUser ? (
                    <div className="relative" ref={profileMenuRef}>
                        <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="relative flex items-center space-x-2 focus:outline-none">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-orange-500">
                                {currentUser.profilePictureUrl ? <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-slate-500" />}
                            </div>
                        </button>
                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-20 py-2 border border-slate-200 dark:border-slate-700 animate-scale-in">
                                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700">{t('nav_profile')}</Link>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">{t('nav_logout')}</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center space-x-4">
                        <NavLink to="/login" className="font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600">{t('nav_login')}</NavLink>
                        <NavLink to="/signup" className="bg-orange-500 text-white font-bold py-2 px-5 rounded-full hover:bg-orange-600 shadow-md">Join</NavLink>
                    </div>
                )}
            </div>

          <div className="lg:hidden flex items-center space-x-4">
              <button onClick={() => setIsMenuOpen(true)} className="text-slate-700 dark:text-slate-300"><MenuIcon className="w-8 h-8" /></button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-slate-50/95 dark:bg-slate-900/95 z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 lg:hidden flex flex-col`}>
        <div className="p-4 flex justify-between items-center border-b">
           <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 text-2xl font-bold">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <button onClick={() => setIsMenuOpen(false)} className="text-slate-700"><CloseIcon className="w-8 h-8" /></button>
        </div>
        <div className="flex flex-col space-y-6 p-10 text-center">
            <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">Home</NavLink>
            <NavLink to="/shop" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">Shop</NavLink>
            <NavLink to="/services" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold">Services</NavLink>
            <NavLink to="/plus-membership" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-orange-500">PetBhai+</NavLink>
        </div>
      </div>
    </>
  );
};

export default Header;