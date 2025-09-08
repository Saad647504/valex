import { useEffect, useState, useCallback } from 'react';

export const useScrollTransform = (enabled: boolean = true) => {
  const [scrollY, setScrollY] = useState(0);
  
  const updateScroll = useCallback(() => {
    if (!enabled) return;
    setScrollY(window.scrollY);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, updateScroll]);

  return scrollY;
};