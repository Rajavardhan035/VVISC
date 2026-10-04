import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, FastForward } from 'lucide-react';
import { useImageSequence } from '../hooks/useImageSequence';

interface LogoSequenceProps {
  onSequenceReady?: () => void;
}

export const LogoSequence: React.FC<LogoSequenceProps> = ({
  onSequenceReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const hasStartedRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);
  const currentFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const totalFrames = 250;
  const { getFrame, isReady } = useImageSequence({
    totalFrames,
    basePath: '/logo-sequence/frame-',
    extension: '.jpg',
    initialBatchSize: 45,
  });

  // Ensure scroll is at top on fresh load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isReady && onSequenceReady) {
      onSequenceReady();
    }
  }, [isReady, onSequenceReady]);

  // FULL SCREEN COVER Rendering Algorithm: completely fills the screen without box or borders
  const renderFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = getFrame(frameIdx);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Warm parchment ivory tone matching frames
    ctx.fillStyle = '#ede7dc';
    ctx.fillRect(0, 0, width, height);

    // COVER ALGORITHM (Edge-to-edge full screen, never in a letterboxed box)
    const imgWidth = img.naturalWidth || 1920;
    const imgHeight = img.naturalHeight || 1080;
    const canvasRatio = width / height;
    const imgRatio = imgWidth / imgHeight;

    let renderW: number;
    let renderH: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasRatio > imgRatio) {
      // Screen is wider than 16:9 (e.g. desktop/ultrawide)
      renderW = width;
      renderH = width / imgRatio;
      offsetX = 0;
      offsetY = (height - renderH) / 2;
    } else {
      // Screen is taller than 16:9 (e.g. tablet/mobile)
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  }, [getFrame]);

  // Initial draw of Frame 1 once initial batch is ready
  useEffect(() => {
    if (isReady && !hasStartedRef.current) {
      renderFrame(0);
    }
  }, [isReady, renderFrame]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      renderFrame(currentFrameRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderFrame]);

  // Fast-forward / Skip directly to final locked frame
  const skipToFinalFrame = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    hasStartedRef.current = true;
    hasCompletedRef.current = true;
    currentFrameRef.current = totalFrames - 1;
    renderFrame(totalFrames - 1);
    setIsPlaying(false);
    setIsCompleted(true);
    setHasStarted(true);
    document.body.style.overflow = '';
  }, [renderFrame, totalFrames]);

  // Trigger-Once Cinematic Animation Execution
  const triggerSequence = useCallback(() => {
    if (hasStartedRef.current || hasCompletedRef.current || !isReady) return;

    hasStartedRef.current = true;
    setHasStarted(true);
    setIsPlaying(true);

    // Temporarily lock body scroll while the cinematic opening unfolds
    document.body.style.overflow = 'hidden';

    // Cinematic playback over ~3.8 seconds
    const duration = 3800;
    const startTime = performance.now();

    const animateLoop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth progression from frame 0 to frame 249
      const targetFrame = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
      currentFrameRef.current = targetFrame;
      renderFrame(targetFrame);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animateLoop);
      } else {
        // Animation finished! Lock permanently on Frame 250
        currentFrameRef.current = totalFrames - 1;
        renderFrame(totalFrames - 1);
        hasCompletedRef.current = true;
        setIsCompleted(true);
        setIsPlaying(false);

        // Unlock body scroll so user can freely scroll the rest of the site
        document.body.style.overflow = '';
      }
    };

    rafIdRef.current = requestAnimationFrame(animateLoop);
  }, [isReady, renderFrame, totalFrames]);

  // Listen for the first user scroll / gesture to trigger the sequence
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // If user hasn't started yet and scrolls down
      if (!hasStartedRef.current && e.deltaY > 0) {
        e.preventDefault();
        triggerSequence();
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!hasStartedRef.current) {
        const touchCurrentY = e.touches[0].clientY;
        // User swiped down/up
        if (touchStartY - touchCurrentY > 10) {
          e.preventDefault();
          triggerSequence();
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!hasStartedRef.current) {
        if (['ArrowDown', 'PageDown', 'Space', ' '].includes(e.key)) {
          e.preventDefault();
          triggerSequence();
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [triggerSequence]);

  return (
    <div
      ref={containerRef}
      id="hero"
      className="relative w-full h-screen bg-[#ede7dc] overflow-hidden select-none"
    >
      {/* Fullscreen Edge-to-Edge Canvas (Cover Fit, No Letterbox, No Box) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Subtle Paper Grain Ambient Texture */}
      <div className="absolute inset-0 pointer-events-none paper-grain opacity-40" />

      {/* State 1: Beginning Prompt (Before User Scrolls) */}
      {!hasStarted && (
        <div
          onClick={triggerSequence}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer z-30 transition-all duration-500 hover:scale-105"
        >
          <div className="px-6 py-3 rounded-full bg-botanical-900/90 backdrop-blur-md border border-gold-500/40 flex items-center space-x-3 shadow-2xl shadow-botanical-950/40">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-ping" />
            <span className="text-xs font-mono uppercase tracking-widest text-ivory-100 font-semibold">
              Scroll Once to Begin
            </span>
          </div>
          <span className="text-[10px] font-mono text-botanical-800/80 mt-2">
            Click or scroll to start introduction
          </span>
        </div>
      )}

      {/* State 2: While Playing (Cinematic Playback with Skip Option) */}
      {isPlaying && (
        <div className="absolute top-24 right-6 md:right-10 z-30 flex items-center space-x-3">
          <button
            onClick={skipToFinalFrame}
            className="px-4 py-1.5 rounded-full bg-botanical-900/80 backdrop-blur-md border border-gold-500/30 text-[11px] font-mono uppercase tracking-wider text-gold-300 hover:bg-botanical-800 flex items-center space-x-1.5 transition-colors shadow-lg"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3 h-3 text-gold-400" />
          </button>
        </div>
      )}
    </div>
  );
};
