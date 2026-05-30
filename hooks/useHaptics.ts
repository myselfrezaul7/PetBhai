import { useCallback } from 'react';

/**
 * A custom hook to trigger haptic feedback on supported devices.
 * Uses the HTML5 navigator.vibrate API.
 * Gracefully fails on unsupported devices (e.g., iOS Safari or desktop).
 */
export const useHaptics = () => {
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore errors on unsupported devices
      }
    }
  }, []);

  const hapticLight = useCallback(() => triggerHaptic(10), [triggerHaptic]);
  const hapticMedium = useCallback(() => triggerHaptic(20), [triggerHaptic]);
  const hapticHeavy = useCallback(() => triggerHaptic(40), [triggerHaptic]);
  const hapticSuccess = useCallback(() => triggerHaptic([15, 50, 20]), [triggerHaptic]);
  const hapticError = useCallback(() => triggerHaptic([30, 40, 30, 40, 40]), [triggerHaptic]);

  return {
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticError,
    triggerCustom: triggerHaptic,
  };
};
