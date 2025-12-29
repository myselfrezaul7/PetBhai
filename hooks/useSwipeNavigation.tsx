import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeConfig {
  threshold?: number; // Minimum distance for a swipe
  velocityThreshold?: number; // Minimum velocity for a swipe
  enabled?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disableOnInputFocus?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

// Route order for navigation
const ROUTE_ORDER = ['/', '/shop', '/services', '/community', '/blog'];

export const useSwipeNavigation = (config: SwipeConfig = {}) => {
  const {
    threshold = 100,
    velocityThreshold = 0.3,
    enabled = true,
    onSwipeLeft,
    onSwipeRight,
    disableOnInputFocus = true,
  } = config;

  const navigate = useNavigate();
  const location = useLocation();
  const startPoint = useRef<TouchPoint | null>(null);
  const isScrolling = useRef<boolean | null>(null);

  const handleSwipeLeft = useCallback(() => {
    if (onSwipeLeft) {
      onSwipeLeft();
      return;
    }

    // Default: navigate to next page in order
    const currentIndex = ROUTE_ORDER.indexOf(location.pathname);
    if (currentIndex !== -1 && currentIndex < ROUTE_ORDER.length - 1) {
      navigate(ROUTE_ORDER[currentIndex + 1]);
    }
  }, [location.pathname, navigate, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    if (onSwipeRight) {
      onSwipeRight();
      return;
    }

    // Default: navigate to previous page in order or go back
    const currentIndex = ROUTE_ORDER.indexOf(location.pathname);
    if (currentIndex > 0) {
      navigate(ROUTE_ORDER[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  }, [location.pathname, navigate, onSwipeRight]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't trigger if focused on input elements
      if (disableOnInputFocus) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const touch = e.touches[0];
      startPoint.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isScrolling.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startPoint.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startPoint.current.x;
      const deltaY = touch.clientY - startPoint.current.y;

      // Determine if this is a horizontal swipe or vertical scroll
      if (isScrolling.current === null) {
        isScrolling.current = Math.abs(deltaY) > Math.abs(deltaX);
      }

      // If it's a vertical scroll, don't interfere
      if (isScrolling.current) {
        startPoint.current = null;
        return;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startPoint.current || isScrolling.current) {
        startPoint.current = null;
        isScrolling.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startPoint.current.x;
      const deltaY = touch.clientY - startPoint.current.y;
      const deltaTime = Date.now() - startPoint.current.time;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if it's a valid horizontal swipe
      const isHorizontalSwipe =
        Math.abs(deltaX) > Math.abs(deltaY) && // More horizontal than vertical
        Math.abs(deltaX) > threshold && // Meets distance threshold
        velocity > velocityThreshold; // Meets velocity threshold

      if (isHorizontalSwipe) {
        if (deltaX > 0) {
          // Swipe right (go back)
          handleSwipeRight();
        } else {
          // Swipe left (go forward)
          handleSwipeLeft();
        }
      }

      startPoint.current = null;
      isScrolling.current = null;
    };

    // Add edge detection for swipe from left edge (like iOS back gesture)
    const handleEdgeSwipe = (e: TouchEvent) => {
      const touch = e.touches[0];
      // If touch starts from left 20px edge
      if (touch.clientX < 20) {
        startPoint.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    enabled,
    threshold,
    velocityThreshold,
    disableOnInputFocus,
    handleSwipeLeft,
    handleSwipeRight,
  ]);

  return {
    isSupported: 'ontouchstart' in window,
  };
};

// Component wrapper for swipe navigation
interface SwipeNavigationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const SwipeNavigationProvider: React.FC<SwipeNavigationProviderProps> = ({
  children,
  enabled = true,
}) => {
  useSwipeNavigation({ enabled });
  return <>{children}</>;
};

export default useSwipeNavigation;
