import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import CookiePolicyModal from './CookiePolicyModal';
import {
  clearOptionalActivityStorage,
  COOKIE_CONSENT_KEY,
  hasOptionalCookieConsent,
  readCookieConsent,
  type CookieConsentStatus,
} from '../lib/cookieConsent';

// --- Context Definition ---
interface CookieConsentContextType {
  consent: CookieConsentStatus;
  setConsent: (consent: 'necessary' | 'all') => void;
  hasOptionalConsent: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsentState] = useState<CookieConsentStatus>(readCookieConsent);

  const setConsent = useCallback((newConsent: 'necessary' | 'all') => {
    try {
      safeStorage.setItem(COOKIE_CONSENT_KEY, newConsent);
      setConsentState(newConsent);

      if (newConsent === 'necessary') {
        clearOptionalActivityStorage();
      }
    } catch (error) {
      console.error('Could not save cookie consent to safeStorage', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      consent,
      setConsent,
      hasOptionalConsent: hasOptionalCookieConsent(consent),
    }),
    [consent, setConsent]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

// --- Banner Component ---
const CookieConsentBanner: React.FC = () => {
  const { consent, setConsent } = useCookieConsent();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (consent === null) {
      // Show the banner after a short delay if no choice has been made
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [consent]);

  const handleConsent = (newConsent: 'necessary' | 'all') => {
    setConsent(newConsent);
    setIsVisible(false);
  };

  const handleLearnMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-50 transition-transform duration-500 ease-in-out border-t border-white/20 dark:border-slate-700/50 translate-y-0"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-700 dark:text-slate-200 text-center md:text-left">
              We use cookies to improve your experience. "Reject optional" keeps only strictly
              necessary cookies. "Accept all" enables optional activity memory and third-party
              features like live chat.{' '}
              <button
                type="button"
                onClick={handleLearnMoreClick}
                className="font-semibold text-orange-600 hover:underline"
              >
                Learn More
              </button>
              .
            </p>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleConsent('necessary')}
                className="px-5 py-2 rounded-full font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors"
              >
                Reject optional
              </button>
              <button
                type="button"
                onClick={() => handleConsent('all')}
                className="px-5 py-2 rounded-full font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors transform hover:scale-105"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
      <CookiePolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default CookieConsentBanner;
