// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { getTour } from '@/components/cosmos/data/tours';
import type { TourStop } from '@/components/cosmos/types';

/** Archival imagery supports narration; never imply it shows this exact simulated instant. */
export function tourPhotoIds(tourId: string, stop: TourStop): string[] {
  if (stop.photoIds?.length && !stop.id.endsWith('-neptune')) return stop.photoIds;
  const bodyPhotos: Record<string, string> = { earth: 'earth-archive', jupiter: 'voyager-jupiter', saturn: 'voyager-saturn', uranus: 'voyager-uranus', neptune: 'voyager-neptune' };
  const bodyPhoto = bodyPhotos[stop.locationId];
  if (bodyPhoto && (tourId === 'begin-at-earth' || stop.viewBodyId)) return [bodyPhoto];
  if (tourId === 'begin-at-earth') return [];
  return [{ 'lunar-rovers': 'lunar-rovers-1', 'voyager-1': 'voyager-1-4', 'voyager-2': 'voyager-2-2' }[tourId] ?? `${tourId}-1`];
}

/** Tour trails are temporary and exclusive; ordinary exploration keeps its own setting. */
export function machineTrailVisible(id: string, state: { isTouring: boolean; activeTourId: string; tourIndex: number; showTrails: boolean }) {
  if (!state.isTouring || state.activeTourId === 'begin-at-earth') return state.showTrails;
  return getTour(state.activeTourId).stops[state.tourIndex]?.follow === `hw:${id}`;
}