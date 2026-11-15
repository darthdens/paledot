// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, downloadStore, isLargeDownload } from './download';
afterEach(() => vi.unstubAllGlobals());
describe('Large-file download progress', () => {
  it('shows progress only above 500 KB', () => {
    expect(isLargeDownload({ loaded: 0, total: 500_000 })).toBe(false);
    expect(isLargeDownload({ loaded: 0, total: 500_001 })).toBe(true);
    expect(isLargeDownload({ loaded: 500_001, total: null })).toBe(true);
  });
  it('streams bytes, announces the known total and clears completion', async () => {
    const observed: number[] = [];
    const unsubscribe = downloadStore.subscribe(() => observed.push(downloadStore.snapshot()[0]?.total ?? 0));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(600_000), { headers: { 'content-length': '600000', 'content-type': 'image/webp' } })));
    const blob = await downloadBlob('/photo.webp');
    expect(blob.size).toBe(600_000); expect(blob.type).toBe('image/webp');
    expect(observed).toContain(600_000); expect(downloadStore.snapshot()).toHaveLength(0);
    unsubscribe();
  });
  it('rejects failed downloads without leaving progress active', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(downloadBlob('/missing.webp')).rejects.toThrow('404');
    expect(downloadStore.snapshot()).toHaveLength(0);
  });
});