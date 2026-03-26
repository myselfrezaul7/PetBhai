import { useCallback, useEffect, useState } from 'react';

export const PWA_INSTALL_DISMISS_KEY = 'petbhai_pwa_install_banner_dismissed_at';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const getIsStandalone = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches;
};

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(max-width: 767px)').matches;
};

export const usePWAInstall = () => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    const mobileMediaQuery = window.matchMedia('(max-width: 767px)');

    const handleStandaloneChange = () => setIsStandalone(displayModeMediaQuery.matches);
    const handleMobileChange = () => setIsMobile(mobileMediaQuery.matches);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };

    displayModeMediaQuery.addEventListener('change', handleStandaloneChange);
    mobileMediaQuery.addEventListener('change', handleMobileChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      displayModeMediaQuery.removeEventListener('change', handleStandaloneChange);
      mobileMediaQuery.removeEventListener('change', handleMobileChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installEvent) {
      return 'unavailable';
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    return choice.outcome;
  }, [installEvent]);

  return {
    canPromptInstall: Boolean(installEvent) && !isStandalone && isMobile,
    isStandalone,
    promptInstall,
  };
};

export default usePWAInstall;
