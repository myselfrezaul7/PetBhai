import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Download/Install Icon
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const SmartphoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('petbhai_pwa_dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Don't show again for 7 days after dismissal
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the banner after a delay (don't immediately annoy users)
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show the banner after some time
    if (isIOSDevice) {
      setTimeout(() => {
        setShowBanner(true);
      }, 5000);
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowPrompt(false);
      localStorage.removeItem('petbhai_pwa_dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      setShowBanner(false);
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
      setShowPrompt(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('petbhai_pwa_dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Don't show if no prompt available and not iOS
  if (!showBanner && !showPrompt && !showIOSInstructions) return null;

  return (
    <>
      {/* Bottom Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white p-4 shadow-2xl">
            <div className="container mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl">
                  <SmartphoneIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base">Install PetBhai App</p>
                  <p className="text-xs sm:text-sm text-orange-100">
                    Get faster access, offline mode & notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 bg-white text-orange-600 font-bold py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Install</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Dismiss"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <SmartphoneIcon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Add to Home Screen
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                aria-label="Close install instructions"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Install PetBhai on your iPhone for the best experience:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    Tap the Share button
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Find the{' '}
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </span>{' '}
                    icon at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    Scroll and tap "Add to Home Screen"
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Look for the{' '}
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>{' '}
                    icon in the share menu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    Tap "Add" to confirm
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    PetBhai will be added to your home screen
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
