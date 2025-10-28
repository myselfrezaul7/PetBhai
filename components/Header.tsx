import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MenuIcon, CloseIcon, SearchIcon } from './icons';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeLinkClass = 'text-orange-600 font-semibold';
  const inactiveLinkClass = 'text-slate-600 hover:text-orange-600';
  
  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const MobileNavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => (
    <NavLink 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) => `block py-3 text-2xl text-center ${isActive ? 'text-orange-500 font-bold' : 'text-slate-700 font-medium'}`}
    >
        {children}
    </NavLink>
  );

  return (
    <>
      <header className="bg-white/80 shadow-sm sticky top-0 z-20 backdrop-blur-lg">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <NavLink to="/" className="flex items-center space-x-2 text-2xl font-bold text-slate-800">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex items-center space-x-8 text-base font-medium">
              <li><NavLink to="/" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Home</NavLink></li>
              <li><NavLink to="/adopt" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Adopt</NavLink></li>
              <li><NavLink to="/shop" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Shop</NavLink></li>
              <li><NavLink to="/community" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Community</NavLink></li>
              <li><NavLink to="/report" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Report</NavLink></li>
              <li><NavLink to="/online-vet" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>Online Vet</NavLink></li>
              <li><NavLink to="/ai-assistant" className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}>AI Assistant</NavLink></li>
            </ul>
             {/* Search Bar */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search for pets, articles..."
                className="w-64 py-2 pl-10 pr-4 text-slate-700 bg-slate-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                aria-label="Search"
              />
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && currentUser ? (
                  <>
                      <span className="font-semibold text-slate-700">Hi, {currentUser.name.split(' ')[0]}</span>
                      <button onClick={handleLogout} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700">Logout</button>
                  </>
              ) : (
                  <>
                      <NavLink to="/login" className="font-semibold text-slate-600 hover:text-orange-600">Login</NavLink>
                      <NavLink to="/signup" className="bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-all transform hover:scale-105">Sign Up</NavLink>
                  </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className="text-slate-700 hover:text-orange-600">
              <MenuIcon className="w-8 h-8" />
            </button>
          </div>
        </nav>
      </header>
      
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-50 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
           <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 text-2xl font-bold text-slate-800">
            <Logo className="w-10 h-10 text-orange-500" />
            <span>PetBhai</span>
          </NavLink>
          <button onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-orange-600">
            <CloseIcon className="w-8 h-8" />
          </button>
        </div>
        <div className="flex flex-col justify-center items-center h-full -mt-16">
            {/* Mobile Search Bar */}
            <div className="w-full px-8 mb-8">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <SearchIcon className="w-6 h-6 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full py-3 pl-12 pr-4 text-slate-800 bg-slate-100 border-2 border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Search"
                />
              </div>
            </div>
            <nav className="flex flex-col space-y-6">
                <MobileNavLink to="/">Home</MobileNavLink>
                <MobileNavLink to="/adopt">Adopt</MobileNavLink>
                <MobileNavLink to="/shop">Shop</MobileNavLink>
                <MobileNavLink to="/community">Community</MobileNavLink>
                <MobileNavLink to="/report">Report</MobileNavLink>
                <MobileNavLink to="/online-vet">Online Vet</MobileNavLink>
                <MobileNavLink to="/ai-assistant">AI Assistant</MobileNavLink>
            </nav>
            <div className="mt-12 w-full px-8">
              {isAuthenticated && currentUser ? (
                  <div className="text-center">
                      <p className="font-semibold text-slate-700 text-xl mb-4">Hi, {currentUser.name.split(' ')[0]}</p>
                      <button onClick={handleLogout} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-slate-700">Logout</button>
                  </div>
              ) : (
                  <div className="flex flex-col space-y-4">
                      <NavLink to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center font-bold text-slate-700 border-2 border-slate-300 py-3 px-5 rounded-lg text-lg hover:bg-slate-100">Login</NavLink>
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