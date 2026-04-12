import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { useEffect, useMemo, useState } from 'react';
import { useCookieConsent } from './CookieConsentBanner';
import useHaptics from '../hooks/useHaptics';
import { PWA_INSTALL_DISMISS_KEY, usePWAInstall } from '../hooks/usePWAInstall';

const HIDE_FOR_DAYS = 7;

const PWAInstallBanner: React.FC = () => {
  const { consent } = useCookieConsent();
  const { triggerHaptic } = useHaptics();
  const { canPromptInstall, promptInstall, isStandalone } = usePWAInstall();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const saved = safeStorage.getItem(PWA_INSTALL_DISMISS_KEY);
    if (!saved) {
      setDismissedAt(null);
      return;
    }

    const parsed = Number(saved);
    setDismissedAt(Number.isFinite(parsed) ? parsed : null);
  }, []);

  const isDismissedRecently = useMemo(() => {
    if (!dismissedAt) {
      return false;
    }

    const daysElapsed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysElapsed < HIDE_FOR_DAYS;
  }, [dismissedAt]);

  const shouldShow = consent === 'all' && canPromptInstall && !isStandalone && !isDismissedRecently;

  const handleDismiss = () => {
    const now = Date.now();
    setDismissedAt(now);
    safeStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(now));
  };

  const handleInstall = async () => {
    triggerHaptic('medium');
    const outcome = await promptInstall();

    if (outcome === 'accepted') {
      triggerHaptic('success');
      safeStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
      setDismissedAt(null);
      return;
    }

    handleDismiss();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-[calc(4.5rem+env(safe-area-inset-top))] left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 md:hidden">
      <div className="rounded-3xl border border-white/80 bg-zinc-900 p-4 text-white shadow-[0_18px_44px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <p className="text-sm font-semibold leading-relaxed text-white/90">
          Install PetBhai for a faster app-like mobile experience with offline support.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] rounded-2xl border border-white/40 bg-white/10 text-sm font-semibold text-white/90 transition-colors hover:bg-white/20 active:scale-95"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="min-h-[44px] rounded-2xl bg-white px-3 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-50 active:scale-95"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
