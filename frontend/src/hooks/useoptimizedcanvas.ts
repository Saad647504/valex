import { useEffect, useRef, useCallback } from 'react';

interface CanvasOptions {
  dpr?: boolean;
  alpha?: boolean;
  desynchronized?: boolean;
}

export const useOptimizedCanvas = (
  drawFn: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, timestamp: number) => void,
  isVisible: boolean,
  options: CanvasOptions = {}
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef(0);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: options.alpha ?? true,
      desynchronized: options.desynchronized ?? true
    });
    
    if (!ctx) return;
    ctxRef.current = ctx;

    const rect = canvas.getBoundingClientRect();
    const dpr = options.dpr !== false ? window.devicePixelRatio : 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    if (options.dpr !== false) {
      ctx.scale(dpr, dpr);
    }
  }, [options.alpha, options.desynchronized, options.dpr]);

  useEffect(() => {
    if (!isVisible) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    setupCanvas();

    const animate = (timestamp: number) => {
      if (!isVisible) return;
      
      // Throttle to 60fps max
      if (timestamp - lastTimeRef.current < 16.67) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      
      if (canvas && ctx) {
        drawFn(ctx, canvas, timestamp);
        lastTimeRef.current = timestamp;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, drawFn, setupCanvas]);

  return canvasRef;
};