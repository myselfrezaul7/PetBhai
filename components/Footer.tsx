import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon, PhoneIcon } from './icons';
import Logo from './Logo';

// WhatsApp Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-lg border-t border-white/30 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 pt-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Column 1: Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-2">
              <Logo className="w-10 h-10 text-orange-500" />
              <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Your Pet's Favorite Partner.</p>
            <div className="text-sm text-slate-500 dark:text-slate-500">
              &copy; {new Date().getFullYear()} PetBhai. All rights reserved.
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              A concern of Kuttawaala and Catwaala animal welfare.
            </p>
          </div>

          {/* Column 2: Get Involved */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Get Involved
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
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
            <div className="flex flex-col items-center md:items-start space-y-3">
              {/* WhatsApp - Primary Contact for Bangladesh */}
              <a
                href="https://wa.me/8801712345678?text=Hi%20PetBhai!"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-semibold"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="tel:+8801712345678"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <PhoneIcon className="w-5 h-5" />
                <span>+880 1712-345678</span>
              </a>

              <a
                href="mailto:petbhaibd@gmail.com"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <MailIcon className="w-5 h-5" />
                <span>petbhaibd@gmail.com</span>
              </a>

              <div className="flex items-center space-x-4 mt-2">
                <a
                  href="https://wa.me/8801712345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:shadow-[0_0_15px_rgba(37,211,102,0.5)]"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    WhatsApp
                  </span>
                </a>
                <a
                  href="https://facebook.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:shadow-[0_0_15px_rgba(24,119,242,0.5)]"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-6 h-6 text-[#1877F2]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    Facebook
                  </span>
                </a>
                <a
                  href="https://instagram.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:shadow-[0_0_15px_rgba(228,64,95,0.5)]"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-6 h-6 text-[#E4405F]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    Instagram
                  </span>
                </a>
                <a
                  href="https://youtube.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 rounded-full transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="w-6 h-6 text-[#FF0000]" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                    YouTube
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Payment Methods & Legal */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              We Accept
            </h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <img
                  src="https://i.ibb.co/27wH07C/bkash.png"
                  alt="bKash"
                  className="h-6"
                  title="bKash"
                />
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <img
                  src="https://i.ibb.co/qjqBcf5/nagad.png"
                  alt="Nagad"
                  className="h-6"
                  title="Nagad"
                />
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <img
                  src="https://i.ibb.co/6wLmMYy/rocket.png"
                  alt="Rocket"
                  className="h-6"
                  title="Rocket"
                />
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                💵 COD
              </div>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex items-center justify-center md:justify-start space-x-2">
              <div className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800/50 flex items-center">
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

        {/* Emergency Helpline Banner */}
        <div className="mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/30">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl p-4 border border-red-200/50 dark:border-red-800/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <PhoneIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="font-bold text-red-600 dark:text-red-400">
                    Pet Emergency Hotline
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    24/7 Available for urgent pet emergencies
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="tel:+8801712345678"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors flex items-center space-x-2"
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>Call Now</span>
                </a>
                <a
                  href="https://wa.me/8801712345678?text=EMERGENCY:%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-colors flex items-center space-x-2"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 py-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-500">
          Made with ❤️ for pets and their families in Bangladesh
        </div>
      </div>
    </footer>
  );
};

export default Footer;
