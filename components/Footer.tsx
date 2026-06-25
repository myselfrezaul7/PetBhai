import React from 'react';
import { Link } from 'react-router-dom';
import { MailIcon, FacebookIcon, InstagramIcon, YouTubeIcon } from './icons';

const Footer: React.FC = () => {
  return (
    <footer className="mt-14 px-4 pb-6 md:px-6" role="contentinfo" aria-label="Site footer">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-10">
          <div className="md:col-span-2">
            <p className="section-eyebrow">Pet Care x Community</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100 md:text-4xl">
              PetBhai
            </h2>
            <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-zinc-300 md:text-base">
              Smart pet care for Bangladesh: shop essentials, book trusted services, and adopt
              responsibly in one experience.
            </p>
            <a
              href="mailto:petbhaibd@gmail.com"
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              <MailIcon className="h-4 w-4" />
              petbhaibd@gmail.com
            </a>
          </div>

          <div className="grid grid-cols-2 gap-6 md:col-span-2 md:gap-10">
            <nav aria-label="Quick links">
              <p className="section-eyebrow">Explore</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/shop"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Shop
                </Link>
                <Link
                  to="/services"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Services
                </Link>
                <Link
                  to="/adopt"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Adopt
                </Link>
                <Link
                  to="/blog"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Blog
                </Link>
                <Link
                  to="/faq"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  FAQ
                </Link>
                <Link
                  to="/safety"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Trust & Safety
                </Link>
                <Link
                  to="/compatibility-quiz"
                  className="text-sm text-slate-700 hover:text-orange-600 dark:text-zinc-300"
                >
                  Compatibility Quiz
                </Link>
              </div>
            </nav>

            <div>
              <p className="section-eyebrow">Connect</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="https://facebook.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-300 dark:hover:text-white"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
                <a
                  href="https://instagram.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-300 dark:hover:text-white"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
                <a
                  href="https://youtube.com/petbhai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-300 dark:hover:text-white"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-zinc-300">
                Payments: bKash, Nagad, COD
              </p>
              <Link
                to="/terms"
                className="mt-2 block text-xs text-slate-500 hover:text-orange-600 dark:text-zinc-300"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-300">
        © 2026 PetBhai. All rights reserved.
      </p>
    </footer>
  );
};

export default React.memo(Footer);
