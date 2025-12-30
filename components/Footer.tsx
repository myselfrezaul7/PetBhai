import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from './icons';
import Logo from './Logo';

// WhatsApp Icon Component - memoized for performance
const WhatsAppIcon: React.FC<{ className?: string }> = memo(({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
));

WhatsAppIcon.displayName = 'WhatsAppIcon';

// Social link configuration for easy maintenance
interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  colorClass: string;
  hoverBg: string;
  glowColor: string;
}

const Footer: React.FC = () => {
  // Memoize the current year to prevent recalculation on each render
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Memoize social links configuration
  const socialLinks: SocialLink[] = useMemo(
    () => [
      {
        name: 'WhatsApp',
        href: 'https://wa.me/8801712345678',
        icon: <WhatsAppIcon className="w-6 h-6" />,
        colorClass: 'text-[#25D366]',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/30',
        glowColor: 'hover:shadow-[0_0_15px_rgba(37,211,102,0.5)]',
      },
      {
        name: 'Facebook',
        href: 'https://facebook.com/petbhai',
        icon: <FacebookIcon className="w-6 h-6" />,
        colorClass: 'text-[#1877F2]',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
        glowColor: 'hover:shadow-[0_0_15px_rgba(24,119,242,0.5)]',
      },
      {
        name: 'Instagram',
        href: 'https://instagram.com/petbhai',
        icon: <InstagramIcon className="w-6 h-6" />,
        colorClass: 'text-[#E4405F]',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-900/30',
        glowColor: 'hover:shadow-[0_0_15px_rgba(228,64,95,0.5)]',
      },
      {
        name: 'YouTube',
        href: 'https://youtube.com/petbhai',
        icon: <YouTubeIcon className="w-6 h-6" />,
        colorClass: 'text-[#FF0000]',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/30',
        glowColor: 'hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]',
      },
    ],
    []
  );
  return (
    <footer
      className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-lg border-t border-white/30 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 pt-12 mt-auto"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Column 1: Logo and Tagline */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-3 mb-2">
              <Logo className="w-10 h-10 text-orange-500" aria-hidden="true" />
              <span className="text-2xl font-bold text-slate-800 dark:text-white">PetBhai</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Your Pet's Favorite Partner.</p>
            <div className="text-sm text-slate-500 dark:text-slate-500">
              &copy; {currentYear} PetBhai. All rights reserved.
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              A concern of Kuttawaala and Catwaala animal welfare.
            </p>
          </div>

          {/* Column 2: Get Involved */}
          <nav aria-label="Get Involved">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              Get Involved
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/adopt"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation"
                >
                  Adopt a Pet
                </Link>
              </li>
              <li>
                <Link
                  to="/volunteer"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation"
                >
                  Report a Rescue
                </Link>
              </li>
              <li>
                <Link
                  to="/safety"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation font-medium text-orange-600 dark:text-orange-400"
                >
                  Safety & Trust
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

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
                className="flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-semibold touch-manipulation active:scale-95"
                aria-label="Contact us on WhatsApp"
              >
                <WhatsAppIcon className="w-5 h-5" aria-hidden="true" />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="mailto:petbhaibd@gmail.com"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation active:scale-95"
                aria-label="Email us at petbhaibd@gmail.com"
              >
                <MailIcon className="w-5 h-5" aria-hidden="true" />
                <span>petbhaibd@gmail.com</span>
              </a>

              <div
                className="flex items-center space-x-4 mt-2"
                role="list"
                aria-label="Social media links"
              >
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative p-2 rounded-full transition-all duration-300 ${link.hoverBg} ${link.glowColor} touch-manipulation active:scale-95`}
                    aria-label={`Follow us on ${link.name}`}
                    role="listitem"
                  >
                    <span className={link.colorClass}>{link.icon}</span>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                      {link.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 4: Payment Methods & Legal */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
              We Accept
            </h3>
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-6">
              bKash, Nagad, COD
            </p>
            <nav aria-label="Legal links">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3 uppercase tracking-wider">
                Legal
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors touch-manipulation"
                  >
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="mt-6 flex items-center justify-center md:justify-start space-x-2">
              <div
                className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800/50 flex items-center"
                role="status"
                aria-label="Verification badge"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
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

      {/* Bottom bar */}
      <div className="mt-8 py-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-500">
          Made with <span aria-label="love">❤️</span> for pets and their families in Bangladesh
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
