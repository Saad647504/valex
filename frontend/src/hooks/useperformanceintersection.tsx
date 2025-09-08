import { useEffect, useState, useCallback } from 'react';

interface PerformanceObserverOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnExit?: boolean;
}

export const usePerformanceIntersection = (options: PerformanceObserverOptions = {}) => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
        
        // Freeze expensive animations when out of view
        if (options.freezeOnExit && !visible) {
          element.style.animationPlayState = 'paused';
        } else if (options.freezeOnExit && visible) {
          element.style.animationPlayState = 'running';
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px'
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [element, hasBeenVisible, options.freezeOnExit, options.rootMargin, options.threshold]);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  return { ref, isVisible, hasBeenVisible };
};