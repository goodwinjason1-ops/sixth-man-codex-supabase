import { useRef, useCallback } from 'react';

/**
 * Hook for detecting horizontal swipe gestures.
 * Only fires when |deltaX| > |deltaY| to avoid hijacking vertical scroll.
 *
 * @param {Function} onSwipeLeft  - Called on left swipe (next)
 * @param {Function} onSwipeRight - Called on right swipe (prev)
 * @param {number}   threshold    - Minimum px to count as swipe (default 50)
 */
export default function useSwipeGesture(onSwipeLeft, onSwipeRight, threshold = 50) {
  const touchStart = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    // Only count as horizontal swipe if |deltaX| > |deltaY|
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
