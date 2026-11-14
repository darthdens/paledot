// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { leftBehindData } from './data.functions';
import type { Photo, Trajectory } from './types';

const cache = new Map<string, Promise<Trajectory | Photo[]>>();
async function read(path: string, action: 'trajectory' | 'photos', id?: string): Promise<Trajectory | Photo[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/left-behind/${path}`;
  const response = await fetch(url);
  if (response.ok) return response.json();
  if (response.status !== 400 && response.status !== 404) throw new Error('Storage read failed');
  await leftBehindData({ data: { action, id } });
  const built = await fetch(url, { cache: 'no-store' });
  if (!built.ok) throw new Error('Left Behind data unavailable');
  return built.json();
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
  return cached(`trajectory:${id}`, () => read(`trajectories/${id}.json`, 'trajectory', id)) as Promise<Trajectory>;
}
export function getPhotoManifest() {
  return cached('photos', () => read('photos/manifest.json', 'photos')) as Promise<Photo[]>;
}
export function clearDataCache() { cache.clear(); }