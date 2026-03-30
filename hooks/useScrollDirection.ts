import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset;

      // Ignore small scroll jumps (often caused by UI layout shifts like Toasts or dynamic updates)
      if (Math.abs(scrollY - lastScrollY) < 30) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      setIsAtTop(scrollY < 50);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, isAtTop };
}
