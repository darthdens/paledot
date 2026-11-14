// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import voyager from '../assets/voyager.glb.asset.json';
import ingenuity from '../assets/ingenuity.glb.asset.json';
import opportunity from '../assets/opportunity.glb.asset.json';
import viking from '../assets/viking.glb.asset.json';
import apollo from '../assets/apollo.glb.asset.json';

/** NASA 3D Resources models (public domain, credited in CREDITS.md). Lunar rovers have no supplied model. */
export const nasaModels: Record<string, { url: string }> = {
  'voyager-1': voyager, 'voyager-2': voyager, ingenuity, opportunity, 'viking-1': viking, 'apollo-11': apollo,
};
import { buildLunarRover } from '../scene/simplifiedModels';
/** No NASA model exists: true-size simplified stand-ins built from NASA-published dimensions. */
export const simplifiedModels: Record<string, () => import('three').Object3D> = { 'apollo-15': buildLunarRover, 'apollo-16': buildLunarRover, 'apollo-17': buildLunarRover };
export function hasNasaModel(id: string) { return !!nasaModels[id]; }

import { getHardware } from '../data/dataClient';
/** True span in scene units (1 unit = 1000 km), loaded from hardware.json. */
export const trueSpanUnits = new Map<string, number>();
// Simplified stand-ins carry their own size (rover frame length 3.1 m, NSSDCA) so they never depend on a cached hardware.json.
for (const id of ['apollo-15', 'apollo-16', 'apollo-17']) trueSpanUnits.set(id, 3.1e-6);
let spans: Promise<void> | null = null;
export function loadTrueSpans() {
  spans ??= getHardware().then(h => { for (const m of h.machines) if (m.trueSize) { const span = m.trueSize.spanM * 1e-6; trueSpanUnits.set(m.id, span); for (const t of m.trajectories) trueSpanUnits.set(t.id, span); } }).catch(() => { spans = null; });
  return spans;
}
