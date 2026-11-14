// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { PlanetId } from './ephemeris';
type Ephemeris = typeof import('./ephemeris');
let loaded: Ephemeris | null = null;
let loading: Promise<Ephemeris> | null = null;
export function loadEphemeris() {
  loading ??= import('./ephemeris').then(module => { loaded = module; return module; });
  return loading;
}
export function getEphemeris() { return loaded; }
export type { PlanetId };