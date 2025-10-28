import React from 'react';
import { MailIcon } from './icons';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-10 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-6 md:space-y-0">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-2">
                <Logo className="w-10 h-10 text-orange-500" />
                <span className="text-2xl font-bold text-white">PetBhai</span>
            </div>
            <p className="text-slate-400">Giving Paws a Second Chance.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white text-lg mb-2">Contact Us</h3>
            <a href="mailto:petbhaibd@gmail.com" className="flex items-center justify-center md:justify-start space-x-2 text-slate-300 hover:text-orange-400 transition-colors">
              <MailIcon className="w-5 h-5" />
              <span>petbhaibd@gmail.com</span>
            </a>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} PetBhai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;