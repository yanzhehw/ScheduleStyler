import { useState, useRef, useCallback } from 'react';
import { BOUNCE_CONFIG } from '../config';

/**
 * Custom hook for creating an overscroll bounce effect on scrollable containers.
 * Returns state and handlers to apply rubber-band style bounce when scrolling past boundaries.
 *
 * Usage:
 * ```tsx
 * const { bounceOffset, isReleasing, scrollRef, handleWheel } = useOverscrollBounce();
 *
 * <div ref={scrollRef} onWheel={handleWheel} className="overflow-auto">
 *   <div style={{
 *     transform: `translateY(${bounceOffset}px)`,
 *     transition: isReleasing ? `transform ${BOUNCE_CONFIG.springDuration}ms ${BOUNCE_CONFIG.springEasing}` : 'none'
 *   }}>
 *     {children}
 *   </div>
 * </div>
 * ```
 */
export function useOverscrollBounce() {
  const [bounceOffset, setBounceOffset] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const bounceOffsetRef = useRef(0); // Track current offset for timeout logic
  const releaseStartTime = useRef<number>(0); // Track when release animation started

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScrollY = scrollHeight - clientHeight;

    const atTop = scrollTop <= 0;
    const atBottom = scrollTop >= maxScrollY;

    const { debug, minDelta, sensitivity, maxDistance, resistanceFactor, maxResistance, releaseDelay, releaseCooldown } = BOUNCE_CONFIG;

    const log = (...args: unknown[]) => {
      if (debug) console.log('[Bounce]', ...args);
    };

    // Ignore low-velocity wheel events (trackpad inertia residue)
    if (Math.abs(e.deltaY) < minDelta) {
      log('Ignored: deltaY', e.deltaY, '< minDelta', minDelta);
      return;
    }

    // During cooldown after release started, ignore wheel events to prevent re-triggering
    // Use ref (synchronous) instead of state (async) for reliable blocking
    if (releaseStartTime.current > 0) {
      const elapsed = Date.now() - releaseStartTime.current;
      log('Cooldown check: elapsed', elapsed, 'ms, cooldown', releaseCooldown, 'ms');
      if (elapsed < releaseCooldown) {
        log('Blocked: still in cooldown');
        return; // Ignore wheel events during cooldown
      }
      // Past cooldown - reset release state and allow new interactions
      log('Cooldown ended, allowing new interactions');
      releaseStartTime.current = 0;
      if (isReleasing) {
        setIsReleasing(false);
      }
    }

    // Always clear existing timeout on any wheel event
    if (bounceTimeout.current) {
      clearTimeout(bounceTimeout.current);
      bounceTimeout.current = null;
    }

    log('Processing wheel event: deltaY', e.deltaY, 'atTop', atTop, 'atBottom', atBottom);

    let bounceY = 0;

    // Vertical bounce - inverted for natural/intuitive scrolling
    if (atTop && e.deltaY < 0) {
      bounceY = Math.min(maxDistance, Math.abs(e.deltaY) * sensitivity);
    } else if (atBottom && e.deltaY > 0) {
      bounceY = Math.max(-maxDistance, -e.deltaY * sensitivity);
    }

    if (bounceY !== 0) {
      // Apply bounce with resistance (diminishing returns as it stretches more)
      setBounceOffset(prev => {
        const newBounce = prev + bounceY;
        const resistance = 1 - Math.min(Math.abs(newBounce) / (maxDistance * resistanceFactor), maxResistance);
        const finalOffset = prev + bounceY * resistance;
        bounceOffsetRef.current = finalOffset;
        return finalOffset;
      });
    }

    // Schedule release check after user stops scrolling
    const effectiveDelay = Math.max(releaseDelay, 16); // Minimum 16ms (one frame) to batch events
    bounceTimeout.current = setTimeout(() => {
      if (bounceOffsetRef.current !== 0) {
        if (BOUNCE_CONFIG.debug) console.log('[Bounce] Release started, offset was:', bounceOffsetRef.current);
        releaseStartTime.current = Date.now();
        setIsReleasing(true);
        setBounceOffset(0);
        bounceOffsetRef.current = 0;

        // Clear CSS transition state after animation completes
        // Note: Do NOT reset releaseStartTime here - let the cooldown check handle it
        setTimeout(() => {
          if (BOUNCE_CONFIG.debug) console.log('[Bounce] Animation complete, clearing isReleasing (cooldown still active)');
          setIsReleasing(false);
        }, BOUNCE_CONFIG.springDuration + 50); // Small buffer after animation
      }
    }, effectiveDelay);
  }, [isReleasing]);

  return {
    bounceOffset,
    isReleasing,
    scrollRef,
    handleWheel,
  };
}

/**
 * Returns the inline style object for the bounce wrapper element.
 * Convenience function to avoid repeating the style logic.
 */
export function getBounceStyle(bounceOffset: number, isReleasing: boolean): React.CSSProperties {
  return {
    transform: `translateY(${bounceOffset}px)`,
    transition: isReleasing
      ? `transform ${BOUNCE_CONFIG.springDuration}ms ${BOUNCE_CONFIG.springEasing}`
      : 'none'
  };
}
