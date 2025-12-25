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
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              A concern of Kuttawaala and Catwaala animal welfare.
            </p>
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

          {/* Column 3: Contact & Social */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex flex-col items-center md:items-start space-y-4">
              <a
                href="mailto:petbhaibd@gmail.com"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <MailIcon className="w-5 h-5" />
                <span>petbhaibd@gmail.com</span>
              </a>

              <div className="flex items-center space-x-4 mt-2">
                <a
                  href="https://facebook.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-[0_0_15px_rgba(24,119,242,0.5)]"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-6 h-6 text-[#1877F2]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    Facebook
                  </span>
                </a>
                <a
                  href="https://instagram.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-[0_0_15px_rgba(228,64,95,0.5)]"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-6 h-6 text-[#E4405F]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    Instagram
                  </span>
                </a>
                <a
                  href="https://youtube.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="w-6 h-6 text-[#FF0000]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    YouTube
                  </span>
                </a>
              </div>
            </div>
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
                Verified by Pet Lovers
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
