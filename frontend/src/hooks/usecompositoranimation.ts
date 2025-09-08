import { useEffect, useRef, useCallback } from 'react';

export const useCompositorAnimation = (
  animationFn: (timestamp: number) => void,
  enabled: boolean = true
) => {
  const rafRef = useRef<number>();
  const isRunningRef = useRef(false);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    const animate = (timestamp: number) => {
      if (!isRunningRef.current) return;
      
      animationFn(timestamp);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
  }, [animationFn]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, start, stop]);

  return { start, stop };
};