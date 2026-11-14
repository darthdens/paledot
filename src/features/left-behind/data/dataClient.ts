// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { Machine, Photo, Trajectory } from './types';

type StaticData = Trajectory | Photo[] | { machines: Machine[] };
const cache = new Map<string, Promise<StaticData>>();
async function read(path: string): Promise<StaticData> {
  const response = await fetch(`/left-behind/${path}`);
  if (!response.ok) throw new Error('TODO(source): Left Behind static data unavailable');
  return response.json();
}
function cached(key: string, build: () => Promise<StaticData>) {
  let promise = cache.get(key);
  if (!promise) {
    promise = build().catch(error => { cache.delete(key); throw error; });
    cache.set(key, promise);
  }
  return promise;
}
export function getTrajectory(id: string) {
  return cached(`trajectory:${id}`, () => read(`trajectories/${encodeURIComponent(id)}.json`)) as Promise<Trajectory>;
}
export function getPhotoManifest() {
  return cached('photos', () => read('photos/manifest.json')) as Promise<Photo[]>;
}
export function getHardware() {
  return cached('hardware', () => read('hardware.json')) as Promise<{ machines: Machine[] }>;
}
export function clearDataCache() { cache.clear(); }