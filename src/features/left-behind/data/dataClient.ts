// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import type { Photo, Trajectory } from './types';

const cache = new Map<string, Promise<Trajectory | Photo[]>>();
async function read(path: string): Promise<Trajectory | Photo[]> {
  const response = await fetch(`/left-behind/${path}`);
  if (!response.ok) throw new Error('TODO(source): Left Behind static data unavailable');
  return response.json();
}
function cached(key: string, build: () => Promise<Trajectory | Photo[]>) {
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
export function clearDataCache() { cache.clear(); }