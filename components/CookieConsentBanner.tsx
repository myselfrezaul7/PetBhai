import React, { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'petbhai_cookie_consent';

const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check localStorage only after the component has mounted on the client-side
    const consentStatus = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consentStatus) {
      // Show the banner after a short delay if no choice has been made
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (consent: 'accepted' | 'declined') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    setIsVisible(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-50 transition-transform duration-500 ease-in-out border-t border-white/20 dark:border-slate-700/50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      aria-hidden={!isVisible}
    >
      <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-700 dark:text-slate-200 text-center md:text-left">
          We use essential cookies to make our site work. We'd also like to use analytics cookies to help us improve our service.
          {' '}
          <a href="#" className="font-semibold text-orange-600 hover:underline">Learn More</a>.
        </p>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => handleConsent('declined')}
            className="px-5 py-2 rounded-full font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => handleConsent('accepted')}
            className="px-5 py-2 rounded-full font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors transform hover:scale-105"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;