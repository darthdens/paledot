// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearDataCache, getPhotoManifest, getTrajectory } from './dataClient';

afterEach(() => { clearDataCache(); vi.unstubAllGlobals(); });
describe('Static Left Behind reads', () => {
  it('reads a trajectory only from its static path and caches it in memory', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'voyager-1', source: 'horizons' }) });
    vi.stubGlobal('fetch', fetcher);
    await getTrajectory('voyager-1'); await getTrajectory('voyager-1');
    expect(fetcher.mock.calls).toEqual([['/left-behind/trajectories/voyager-1.json']]);
  });
  it('reads photos only from the static manifest without a build fallback', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetcher);
    await expect(getPhotoManifest()).rejects.toThrow('TODO(source)');
    expect(fetcher.mock.calls).toEqual([['/left-behind/photos/manifest.json']]);
  });
});