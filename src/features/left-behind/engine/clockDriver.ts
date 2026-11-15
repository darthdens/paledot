// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useSimClock } from '../state/useSimClock';

/** Shared elapsed-time cursor: opening UI and scene never count time twice. */
export function createClockDriver(initialTime: number) {
  let previous = initialTime;
  return (now: number, paused = false) => {
    const seconds = Math.max(0, now - previous) / 1000;
    previous = now;
    if (!paused) useSimClock.getState().advanceClock(seconds);
  };
}

export const tickSimulationClock = createClockDriver(Date.now());