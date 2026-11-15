// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { TourStop } from '@/components/cosmos/types';
/** Slide timing comes from its own dates, never another slide's transient clock state. */
export function tourSlideSeconds(stop: TourStop, machineTour: boolean) {
  const range = stop.date && stop.date !== 'now' && stop.playUntil && stop.rate && stop.rate > 0
    ? (Date.parse(stop.playUntil) - Date.parse(stop.date)) / stop.rate : 0;
  return Math.max(stop.duration, Number.isFinite(range) ? range : 0) + (machineTour ? 1 : 0);
}