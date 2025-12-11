import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from './icons';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 pt-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
          
          {/* Column 1: Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-2">
                <Logo className="w-10 h-10 text-orange-500" />
                <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Your Pet's Favorite Store.</p>
          </div>
          
          {/* Column 2: Get Involved */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Get Involved</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li><Link to="/adopt" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Adopt a Pet</Link></li>
                <li><Link to="/volunteer" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Volunteer</Link></li>
                <li><Link to="/report" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Report a Rescue</Link></li>
                <li><Link to="/faq" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Contact Us</h3>
            <a href="mailto:petbhaibd@gmail.com" className="flex items-center justify-center md:justify-start space-x-2 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              <MailIcon className="w-5 h-5" />
              <span>petbhaibd@gmail.com</span>
            </a>
          </div>

          {/* Column 4: Social Media */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex items-center justify-center md:justify-start space-x-6">
              <a 
                href="https://facebook.com/petbhai" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook" 
                title="Facebook" 
                className="transform transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:drop-shadow-[0_0_10px_rgba(24,119,242,0.5)] active:scale-95"
              >
                <FacebookIcon className="w-8 h-8 text-[#1877F2]" />
              </a>
              <a 
                href="https://instagram.com/petbhai" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                title="Instagram" 
                className="transform transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:drop-shadow-[0_0_10px_rgba(228,64,95,0.5)] active:scale-95"
              >
                <InstagramIcon className="w-8 h-8 text-[#E4405F]" />
              </a>
              <a 
                href="https://youtube.com/petbhai" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="YouTube" 
                title="YouTube" 
                className="transform transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:drop-shadow-[0_0_10px_rgba(255,0,0,0.5)] active:scale-95"
              >
                <YouTubeIcon className="w-8 h-8 text-[#FF0000]" />
              </a>
            </div>
          </div>

        </div>
        <div className="border-t border-slate-300 dark:border-slate-700/50 mt-10 pt-6 text-center text-slate-600 dark:text-slate-300 text-sm">
            <p>&copy; {new Date().getFullYear()} PetBhai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;