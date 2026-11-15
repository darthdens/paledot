// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { getTour } from '@/components/cosmos/data/tours';

/** Tour trails are temporary and exclusive; ordinary exploration keeps its own setting. */
export function machineTrailVisible(id: string, state: { isTouring: boolean; activeTourId: string; tourIndex: number; showTrails: boolean }) {
  if (!state.isTouring || state.activeTourId === 'begin-at-earth') return state.showTrails;
  return getTour(state.activeTourId).stops[state.tourIndex]?.follow === `hw:${id}`;
}