// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef } from 'react';

/** Keep elapsed play time through pause/resume and unrelated scene renders. */
export function useTourPlayback(key: string | null, paused: boolean, seconds: number, advance: () => void) {
  const latest = useRef({ paused, seconds, advance });
  latest.current = { paused, seconds, advance };
  useEffect(() => {
    if (key === null) return;
    let elapsed = 0;
    let previous = performance.now();
    let wasPaused = latest.current.paused;
    const timer = setInterval(() => {
      const now = performance.now();
      const state = latest.current;
      if (!state.paused && !wasPaused) elapsed += (now - previous) / 1000;
      previous = now; wasPaused = state.paused;
      if (!state.paused && elapsed >= state.seconds) { clearInterval(timer); state.advance(); }
    }, 100);
    return () => clearInterval(timer);
  }, [key]);
}