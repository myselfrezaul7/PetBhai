import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'success';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 18,
  success: [12, 28, 12],
};

export const useHaptics = () => {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }

    const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;
    navigator.vibrate(pattern);
  }, []);

  return {
    triggerHaptic,
  };
};

export default useHaptics;
