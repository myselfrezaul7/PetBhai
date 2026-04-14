import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const isReturningToBlog = pathname === '/blog' && prevPath.current.includes('/blog/');
    prevPath.current = pathname;
    
    if (isReturningToBlog) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [pathname]);

  return null;
};
export default ScrollToTopOnNavigate;