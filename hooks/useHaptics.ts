import { useCallback } from 'react';

type NativeHapticStyle =
  | 'CLOCK_TICK'
  | 'CONTEXT_CLICK'
  | 'LONG_PRESS'
  | 'CONFIRM'
  | 'REJECT'
  | 'LIGHT'
  | 'MEDIUM'
  | 'HEAVY'
  | 'SUCCESS'
  | 'ERROR';

interface PetBhaiNativeWindow {
  PetBhaiNative?: {
    triggerHaptic?: (style: NativeHapticStyle) => void;
  };
}

/**
 * A custom hook to trigger haptic feedback on supported devices.
 * Prefers the Capacitor Android native haptic actuator bridge when available,
 * falling back to the HTML5 navigator.vibrate API on mobile web.
 */
export const useHaptics = () => {
  const triggerNativeOrWeb = useCallback(
    (pattern: number | number[], nativeStyle: NativeHapticStyle = 'CLOCK_TICK') => {
      if (typeof window === 'undefined') return;
      const nativeBridge = (window as unknown as PetBhaiNativeWindow).PetBhaiNative;
      if (typeof nativeBridge?.triggerHaptic === 'function') {
        try {
          nativeBridge.triggerHaptic(nativeStyle);
          return;
        } catch {
          // Fall back to navigator.vibrate
        }
      }
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // Ignore errors on unsupported devices
        }
      }
    },
    []
  );

  const triggerHaptic = useCallback(
    (pattern: number | number[]) => {
      triggerNativeOrWeb(pattern, 'CLOCK_TICK');
    },
    [triggerNativeOrWeb]
  );

  const hapticLight = useCallback(() => triggerNativeOrWeb(10, 'CLOCK_TICK'), [triggerNativeOrWeb]);
  const hapticMedium = useCallback(
    () => triggerNativeOrWeb(20, 'CONTEXT_CLICK'),
    [triggerNativeOrWeb]
  );
  const hapticHeavy = useCallback(() => triggerNativeOrWeb(40, 'LONG_PRESS'), [triggerNativeOrWeb]);
  const hapticSuccess = useCallback(
    () => triggerNativeOrWeb([15, 50, 20], 'CONFIRM'),
    [triggerNativeOrWeb]
  );
  const hapticError = useCallback(
    () => triggerNativeOrWeb([30, 40, 30, 40, 40], 'REJECT'),
    [triggerNativeOrWeb]
  );

  return {
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticError,
    triggerCustom: triggerHaptic,
  };
};
