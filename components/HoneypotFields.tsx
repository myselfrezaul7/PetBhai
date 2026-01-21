import React, { useEffect, useState, useCallback } from 'react';

interface HoneypotFieldsProps {
  /** Callback when form timestamp changes (for timing validation) */
  onTimestampChange?: (timestamp: number) => void;
  /** Include hidden timestamp field */
  includeTimestamp?: boolean;
}

/**
 * Honeypot fields component for bot protection.
 * These fields are hidden from users but visible to bots.
 * If a bot fills them, the form submission will be silently rejected.
 *
 * Usage:
 * 1. Add <HoneypotFields /> inside your form
 * 2. On form submission, include the hidden field values
 * 3. Backend will validate and reject if honeypot is filled
 */
export const HoneypotFields: React.FC<HoneypotFieldsProps> = ({
  onTimestampChange,
  includeTimestamp = true,
}) => {
  const [timestamp, setTimestamp] = useState<number>(0);

  useEffect(() => {
    const ts = Date.now();
    setTimestamp(ts);
    onTimestampChange?.(ts);
  }, [onTimestampChange]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {/* Honeypot field - should remain empty */}
      <input
        type="text"
        name="website"
        id="website"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        aria-label="Leave this field empty"
      />
      <input
        type="text"
        name="url"
        id="url"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        aria-label="Leave this field empty"
      />
      <input
        type="text"
        name="_hp"
        id="_hp"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        aria-label="Leave this field empty"
      />
      {/* Timestamp for timing validation */}
      {includeTimestamp && (
        <input type="hidden" name="_timestamp" value={timestamp.toString()} readOnly />
      )}
    </div>
  );
};

/**
 * Hook for honeypot validation on form data
 */
export const useHoneypot = () => {
  const [timestamp, setTimestamp] = useState<number>(0);

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  const getHoneypotData = useCallback(() => {
    return {
      _timestamp: timestamp.toString(),
      website: '',
      url: '',
      _hp: '',
    };
  }, [timestamp]);

  const validateHoneypot = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (formData: Record<string, any>): { valid: boolean; reason?: string } => {
      // Check honeypot fields are empty
      const honeypotFields = ['website', 'url', '_hp', 'fax', 'company_website'];
      for (const field of honeypotFields) {
        if (formData[field]) {
          return { valid: false, reason: 'Bot detected via honeypot' };
        }
      }

      // Check form wasn't filled too fast (less than 1 second = likely bot)
      const formTimestamp = parseInt(formData._timestamp || '0', 10);
      if (formTimestamp > 0) {
        const fillTime = Date.now() - formTimestamp;
        if (fillTime < 1000) {
          return { valid: false, reason: 'Form filled too quickly' };
        }
      }

      return { valid: true };
    },
    []
  );

  const cleanFormData = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, any>>(
      formData: T
    ): Omit<T, 'website' | 'url' | '_hp' | '_timestamp'> => {
      const cleaned = { ...formData };
      delete cleaned.website;
      delete cleaned.url;
      delete cleaned._hp;
      delete cleaned._timestamp;
      delete cleaned.fax;
      delete cleaned.company_website;
      return cleaned;
    },
    []
  );

  return {
    timestamp,
    getHoneypotData,
    validateHoneypot,
    cleanFormData,
  };
};

/**
 * Security utilities for form protection
 */
export const SecurityUtils = {
  /**
   * Generate a simple nonce for inline scripts (client-side only)
   */
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return '';
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };
    return input.replace(/[&<>"'`=/]/g, (char) => entities[char] || char);
  },

  /**
   * Check if request looks like it's from a bot
   */
  detectBotBehavior: (): boolean => {
    // Check for common bot indicators
    const indicators = [
      // Check if running in headless mode
      'webdriver' in navigator,
      // Check for automation tools
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window as any).phantom,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window as any).__selenium_unwrapped,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window as any).__webdriver_evaluate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window as any).__driver_evaluate,
      // Check for unusual screen dimensions
      window.outerWidth === 0 || window.outerHeight === 0,
      // Check for plugins (bots often have none)
      navigator.plugins.length === 0,
    ];

    return indicators.some((indicator) => indicator);
  },

  /**
   * Get browser fingerprint (for rate limiting)
   */
  getBrowserFingerprint: async (): Promise<string> => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      'deviceMemory' in navigator
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
        : 'unknown',
    ];

    const data = components.join('|');
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  },
};

export default HoneypotFields;
