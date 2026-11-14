// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { CelestialObject } from '@/components/cosmos/types';
import { UNIFIED_SCALE } from './units';

/** Catalogue solid-body sizes are diameters in kilometres, never radii. */
export function bodyRadius(diameterKm: number, scale = UNIFIED_SCALE): number {
  return diameterKm * 0.5 * scale;
}

export function isSolidBody(object: CelestialObject): boolean {
  return ['planet', 'dwarf-planet', 'moon', 'star'].includes(object.type);
}

/** Preserve landscape composition; pull back on portrait screens, not enlarge bodies. */
export function portraitFramingFactor(aspect: number): number {
  return Math.max(1, 1 / Math.max(aspect, 0.1));
}

export function bodyFlyToDistance(diameterKm: number): number {
  return bodyRadius(diameterKm) * 5;
}

export function bodyClearance(diameterKm: number, near = 0.001): number {
  return bodyRadius(diameterKm) * 1.12 + near;
}

/** At distant stars, origin-based clipping planes would clip the whole star. */
export function closeViewNear(originDistance: number, targetDistance: number): number {
  return Math.max(0.001, Math.min(originDistance / 1e7, targetDistance / 1000));
}