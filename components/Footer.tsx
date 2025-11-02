import React from 'react';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from './icons';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 pt-12 mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Column 1: Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-2">
                <Logo className="w-10 h-10 text-orange-500" />
                <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Your Pet's Favorite Store.</p>
          </div>
          
          {/* Column 2: Contact */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Contact Us</h3>
            <a href="mailto:petbhaibd@gmail.com" className="flex items-center justify-center md:justify-start space-x-2 text-slate-700 dark:text-slate-200 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              <MailIcon className="w-5 h-5" />
              <span>petbhaibd@gmail.com</span>
            </a>
          </div>

          {/* Column 3: Social Media */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Follow Us</h3>
            <div className="flex items-center justify-center md:justify-start space-x-5">
              <a href="#" aria-label="Facebook" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"><FacebookIcon className="w-7 h-7" /></a>
              <a href="#" aria-label="Instagram" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"><InstagramIcon className="w-7 h-7" /></a>
              <a href="#" aria-label="YouTube" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"><YouTubeIcon className="w-7 h-7" /></a>
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