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
export function hasNasaModel(id: string) { return !!nasaModels[id]; }
