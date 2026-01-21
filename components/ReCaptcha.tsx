import React, { useEffect, useRef, useState, useCallback } from 'react';

// reCAPTCHA Site Key - stored in environment variable for security
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

// Declare global grecaptcha type
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact' | 'invisible';
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
      execute: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
  className?: string;
}

// Track if script is loading/loaded
let scriptLoadPromise: Promise<void> | null = null;

const loadReCaptchaScript = (): Promise<void> => {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // Check if already loaded
  if (window.grecaptcha) {
    return Promise.resolve();
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;

    window.onRecaptchaLoad = () => {
      resolve();
    };

    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

/**
 * Google reCAPTCHA v2 Component
 * Use this component in forms to verify human users
 */
export const ReCaptcha: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current !== null) return;

    try {
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: onVerify,
        'expired-callback': () => {
          onExpire?.();
        },
        'error-callback': () => {
          setError('reCAPTCHA error occurred');
          onError?.();
        },
        theme,
        size,
      });
      setIsLoading(false);
    } catch (err) {
      setError('Failed to render reCAPTCHA');
      setIsLoading(false);
    }
  }, [onVerify, onExpire, onError, theme, size]);

  useEffect(() => {
    loadReCaptchaScript()
      .then(() => {
        window.grecaptcha.ready(renderWidget);
      })
      .catch(() => {
        setError('Failed to load reCAPTCHA');
        setIsLoading(false);
      });

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [renderWidget]);

  // Reset method exposed for external use
  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  }, []);

  if (error) {
    return (
      <div className={`text-red-500 text-sm p-2 bg-red-50 rounded ${className}`}>
        {error}. Please refresh the page and try again.
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Loading reCAPTCHA...</span>
        </div>
      )}
      <div ref={containerRef} className={isLoading ? 'hidden' : ''} />
    </div>
  );
};

/**
 * Hook for managing reCAPTCHA state
 */
export const useReCaptcha = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = useCallback((recaptchaToken: string) => {
    setToken(recaptchaToken);
    setIsVerified(true);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  return {
    token,
    isVerified,
    handleVerify,
    handleExpire,
    reset,
  };
};

/**
 * Invisible reCAPTCHA Component for seamless UX
 */
export const InvisibleReCaptcha: React.FC<{
  onVerify: (token: string) => void;
  onError?: () => void;
}> = ({ onVerify, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadReCaptchaScript()
      .then(() => {
        window.grecaptcha.ready(() => {
          if (!containerRef.current || widgetIdRef.current !== null) return;

          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            callback: onVerify,
            'error-callback': onError,
            size: 'invisible',
          });
        });
      })
      .catch(() => {
        onError?.();
      });
  }, [onVerify, onError]);

  // Execute the invisible reCAPTCHA
  const execute = useCallback(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.execute(widgetIdRef.current);
    }
  }, []);

  return <div ref={containerRef} />;
};

export default ReCaptcha;
