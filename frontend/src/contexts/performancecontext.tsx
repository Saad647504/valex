'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

interface PerformanceContextType {
  reducedMotion: boolean;
  connectionSpeed: 'slow' | 'fast';
  deviceTier: 'low' | 'mid' | 'high';
  requestAnimationFrame: (callback: (time: number) => void) => number;
  cancelAnimationFrame: (id: number) => void;
  createOptimizedCanvas: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D;
  throttle: <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => T;
  debounce: <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => T;
  optimizedAnimations: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  reducedMotion: false,
  connectionSpeed: 'fast',
  deviceTier: 'high',
  requestAnimationFrame: (callback: (time: number) => void) => window.requestAnimationFrame(callback),
  cancelAnimationFrame: (id: number) => window.cancelAnimationFrame(id),
  createOptimizedCanvas: (canvas: HTMLCanvasElement) => canvas.getContext('2d')!,
  throttle: <T extends (...args: unknown[]) => unknown>(func: T) => func,
  debounce: <T extends (...args: unknown[]) => unknown>(func: T) => func,
  optimizedAnimations: true
});

export const usePerformanceContext = () => useContext(PerformanceContext);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');
  const [deviceTier, setDeviceTier] = useState<'low' | 'mid' | 'high'>('high');
  const [optimizedAnimations, setOptimizedAnimations] = useState(true);
  
  const animationIds = useRef(new Set<number>());
  const frameCallbacks = useRef(new Map<number, () => void>());
  const frameId = useRef<number | null>(null);

  // Master animation loop for ALL animations
  const masterLoop = useCallback(() => {
    frameCallbacks.current.forEach(callback => callback());
    frameId.current = window.requestAnimationFrame(masterLoop);
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    // Detect connection speed
    if ('connection' in navigator) {
      const conn = (navigator as unknown as { connection: { effectiveType: string } }).connection;
      if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        setConnectionSpeed('slow');
        setOptimizedAnimations(false);
      }
    }

    // Detect device tier and optimize accordingly
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
    
    if (cores <= 2 || memory <= 2) {
      setDeviceTier('low');
      setOptimizedAnimations(false);
    } else if (cores <= 4 || memory <= 4) {
      setDeviceTier('mid');
    }

    // Start master animation loop
    frameId.current = window.requestAnimationFrame(masterLoop);

    return () => {
      if (frameId.current) {
        window.cancelAnimationFrame(frameId.current);
      }
      const currentAnimationIds = animationIds.current;
      currentAnimationIds.forEach(id => window.cancelAnimationFrame(id));
    };
  }, [masterLoop]);

  const optimizedRAF = useCallback((callback: (time: number) => void) => {
    return window.requestAnimationFrame(callback);
  }, []);

  const optimizedCAF = useCallback((id: number) => {
    window.cancelAnimationFrame(id);
  }, []);

  const createOptimizedCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      powerPreference: deviceTier === 'high' ? 'high-performance' : 'default'
    }) as CanvasRenderingContext2D;
    
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = deviceTier === 'high' ? 'high' : 'medium';
    }
    
    return ctx;
  }, [deviceTier]);

  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, delay: number = 16): T => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: unknown[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }, []);

  const debounce = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, delay: number = 300): T => {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: unknown[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }, []);

  return (
    <PerformanceContext.Provider value={{ 
      reducedMotion, 
      connectionSpeed, 
      deviceTier,
      requestAnimationFrame: optimizedRAF,
      cancelAnimationFrame: optimizedCAF,
      createOptimizedCanvas,
      throttle,
      debounce,
      optimizedAnimations
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}