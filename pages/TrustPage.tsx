import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircleIcon, ShieldCheckIcon, UserGroupIcon, HeartIcon } from '../components/icons';

// Temporary local icons if not in icons.tsx
const ShieldCheckIconLocal = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 12c0 5.285 3.04 9.832 7.631 12.24a.75.75 0 00.738 0c4.591-2.408 7.631-6.955 7.631-12.24a12.74 12.74 0 00-.635-6.235.75.75 0 00-.722-.515 11.209 11.209 0 01-7.877-3.08zM12 13.25a.75.75 0 00.75-.75V8.75a.75.75 0 00-1.5 0v3.75c0 .414.336.75.75.75zM12 15a1 1 0 100 2 1 1 0 000-2z"
      clipRule="evenodd"
    />
  </svg>
);

const TrustPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-6">
            {t('trust_title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">{t('trust_subtitle')}</p>
        </div>

        {/* Trust Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Pillar 1: Vetted Products */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-center hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {t('trust_pillar_1_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300">{t('trust_pillar_1_desc')}</p>
          </div>

          {/* Pillar 2: Verified Professionals */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-center hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
              <ShieldCheckIconLocal className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {t('trust_pillar_2_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300">{t('trust_pillar_2_desc')}</p>
          </div>

          {/* Pillar 3: Community Guidelines */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-center hover:transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 dark:text-purple-400">
              <HeartIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {t('trust_pillar_3_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300">{t('trust_pillar_3_desc')}</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-16 max-w-4xl mx-auto">
          <section className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <img
                src="https://picsum.photos/seed/trust-vet/600/400"
                alt="Vet Verification"
                className="rounded-xl shadow-md w-full"
                loading="lazy"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {t('trust_vet_title')}
              </h2>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    Verification of BMDC (Bangladesh Medical and Dental Council) registration or
                    relevant veterinary license.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Review of academic qualifications and degrees.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Background checks for any past malpractice.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <img
                src="https://picsum.photos/seed/trust-delivery/600/400"
                alt="Secure Delivery"
                className="rounded-xl shadow-md w-full"
                loading="lazy"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {t('trust_delivery_title')}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We use industry-standard encryption to protect your payment data. Our delivery
                partners are trained to handle pet products with care.
              </p>
              <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Cash on Delivery available for your peace of mind.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Easy 7-day return policy for damaged or incorrect items.</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TrustPage;
