import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon, CheckCircleIcon, HeartIcon } from './icons';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 pt-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-2">
                <Logo className="w-10 h-10 text-orange-500" />
                <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Your Animal's Forever Friend.</p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                    Verified Vets
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                    <HeartIcon className="w-3 h-3 text-orange-500" />
                    Charity Support
                </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Get Involved</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li><Link to="/adopt" className="hover:text-orange-500 transition-colors">Adopt a Pet</Link></li>
                <li><Link to="/volunteer" className="hover:text-orange-500 transition-colors">Volunteer</Link></li>
                <li><Link to="/report" className="hover:text-orange-500 transition-colors">Report a Rescue</Link></li>
                <li><Link to="/faq" className="hover:text-orange-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">Contact Us</h3>
            <a href="mailto:petbhaibd@gmail.com" className="flex items-center justify-center md:justify-start space-x-2 hover:text-orange-500 transition-colors mb-2">
              <MailIcon className="w-5 h-5" />
              <span>petbhaibd@gmail.com</span>
            </a>
            <p className="text-sm text-slate-500 dark:text-slate-400">Available 24/7 for support.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex items-center justify-center md:justify-start space-x-6">
              <a href="https://facebook.com/petbhai" target="_blank" rel="noopener" className="hover:scale-125 transition-transform"><FacebookIcon className="w-7 h-7 text-[#1877F2]" /></a>
              <a href="https://instagram.com/petbhai" target="_blank" rel="noopener" className="hover:scale-125 transition-transform"><InstagramIcon className="w-7 h-7 text-[#E4405F]" /></a>
              <a href="https://youtube.com/petbhai" target="_blank" rel="noopener" className="hover:scale-125 transition-transform"><YouTubeIcon className="w-7 h-7 text-[#FF0000]" /></a>
            </div>
          </div>

        </div>
        <div className="border-t border-slate-300 dark:border-slate-700/50 mt-10 py-6 flex flex-col md:flex-row justify-between items-center text-slate-600 dark:text-slate-300 text-sm gap-4">
            <p>&copy; {new Date().getFullYear()} PetBhai. All rights reserved.</p>
            <div className="flex gap-6">
                <Link to="/privacy" className="hover:text-orange-500 underline decoration-slate-300 underline-offset-4">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-orange-500 underline decoration-slate-300 underline-offset-4">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;