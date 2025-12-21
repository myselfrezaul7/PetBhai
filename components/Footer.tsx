import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from './icons';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 pt-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Column 1: Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-2">
              <Logo className="w-10 h-10 text-orange-500" />
              <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Your Pet's Favorite Partner.</p>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} PetBhai. All rights reserved.
            </div>
          </div>

          {/* Column 2: Get Involved */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Get Involved
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <Link
                  to="/adopt"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Adopt a Pet
                </Link>
              </li>
              <li>
                <Link
                  to="/volunteer"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Report a Rescue
                </Link>
              </li>
              <li>
                <Link
                  to="/safety"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium text-orange-600 dark:text-orange-400"
                >
                  Safety & Trust
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Connect */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Connect
            </h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300">
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start space-x-2 hover:text-blue-600 transition-colors"
                >
                  <FacebookIcon className="w-5 h-5" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start space-x-2 hover:text-pink-600 transition-colors"
                >
                  <InstagramIcon className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start space-x-2 hover:text-red-600 transition-colors"
                >
                  <YouTubeIcon className="w-5 h-5" />
                  <span>YouTube</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@petbhai.com"
                  className="flex items-center justify-center md:justify-start space-x-2 hover:text-orange-500 transition-colors"
                >
                  <MailIcon className="w-5 h-5" />
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Join the Family
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Subscribe for pet care tips, new arrivals, and community stories.
            </p>
            <form className="flex flex-col space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors shadow-md"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-6 flex items-center justify-center md:justify-start space-x-2">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Pet Lovers
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
