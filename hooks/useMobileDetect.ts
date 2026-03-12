import { useState, useEffect, useMemo } from 'react';

const MOBILE_BREAKPOINT = 768; // px

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect touch-capable non-mobile devices (tablets like iPad).
  // iPadOS 13+ reports as desktop Safari, but has touch support.
  // CSS zoom behaves inconsistently with text on iPadOS due to
  // -webkit-text-size-adjust, so these devices need transform: scale() instead.
  const isTablet = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !isMobile && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, [isMobile]);

  return { isMobile, isTablet };
}
