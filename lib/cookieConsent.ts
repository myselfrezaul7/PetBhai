import { safeStorage, safeSessionStorage } from './storage';
export type CookieConsentStatus = 'necessary' | 'all' | null;

export const COOKIE_CONSENT_KEY = 'petbhai_cookie_consent';

export const OPTIONAL_ACTIVITY_STORAGE_KEYS = [
  'petbhai_recent_searches',
  'petbhai_recently_viewed',
  'petbhai_pwa_install_banner_dismissed_at',
] as const;

export const readCookieConsent = (): CookieConsentStatus => {
  if (typeof window === 'undefined' || !safeStorage) {
    return null;
  }

  const storedConsent = safeStorage.getItem(COOKIE_CONSENT_KEY);
  if (storedConsent === 'necessary' || storedConsent === 'all') {
    return storedConsent;
  }

  return null;
};

export const hasOptionalCookieConsent = (consent: CookieConsentStatus): boolean => consent === 'all';

export const clearOptionalActivityStorage = (): void => {
  if (typeof window === 'undefined' || !safeStorage) {
    return;
  }

  for (const key of OPTIONAL_ACTIVITY_STORAGE_KEYS) {
    safeStorage.removeItem(key);
  }
};
