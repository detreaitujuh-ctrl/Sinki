import { useCallback, useRef } from 'react';

export const DEFAULT_TICKER_SPEED_PX_PER_SEC = 26;

/**
 * Callback ref hook that keeps any `.luxury-ticker-track` element scrolling
 * at an exact, uniform pixel-per-second velocity (default: 26 px/s),
 * regardless of text length, font choice, review count, or tab visibility.
 */
export function useConstantTickerSpeed(
  speedPxPerSec: number = DEFAULT_TICKER_SPEED_PX_PER_SEC
) {
  const observerRef = useRef<ResizeObserver | null>(null);

  return useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      const applyDuration = () => {
        const totalWidth = node.getBoundingClientRect().width || node.scrollWidth;
        const halfTrackPx = totalWidth / 2;
        if (halfTrackPx > 0 && speedPxPerSec > 0) {
          const durationSec = halfTrackPx / speedPxPerSec;
          node.style.setProperty('--ticker-duration', `${durationSec.toFixed(2)}s`);
        }
      };

      applyDuration();

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          applyDuration();
        });
        ro.observe(node);
        observerRef.current = ro;
      }

      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready
          .then(() => {
            if (node.isConnected) {
              applyDuration();
            }
          })
          .catch(() => {});
      }
    },
    [speedPxPerSec]
  );
}
