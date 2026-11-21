import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HIDE_ON_ROUTES = ['/product/', '/checkout', '/ai-assistant', '/services/booking'];

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const shouldHide = HIDE_ON_ROUTES.some((route) => location.pathname.startsWith(route));
  const isServicesLanding = location.pathname === '/services';

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    let frameId: number | null = null;

    const updateVisibility = () => {
      const shouldBeVisible = window.scrollY > 300;
      setIsVisible((prev) => (prev === shouldBeVisible ? prev : shouldBeVisible));
    };

    const onScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        updateVisibility();
        frameId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateVisibility();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (shouldHide) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed right-5 bottom-[calc(5.75rem+var(--safe-bottom))] md:bottom-6 w-11 h-11 md:w-12 md:h-12 bg-orange-500 text-white rounded-full shadow-lg z-30 ${
        isServicesLanding ? 'hidden md:flex' : 'flex'
      } items-center justify-center transition-all duration-300 transform
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
      aria-label="Go to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

export default ScrollToTop;
