// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sources from '@/assets/textures/texture-sources.json';

describe('Correctly sourced replacement maps', () => {
  for (const body of ['pluto', 'titan', 'europa', 'ceres', 'enceladus', 'triton', 'iapetus', 'phobos', 'deimos', 'moon', 'earth-clouds']) {
    it(`${body} has its own source and no incorrect bundled predecessor`, () => {
      const source = sources.find(row => row.body === body);
      expect(source).toBeDefined();
      if (!source) throw new Error(`Missing ${body} source`);
      expect(source.downloadUrl).not.toMatch(/fictional|saturn_ring/);
      expect(source.bytes).toBeLessThan(10_000_000);
      const asset = JSON.parse(readFileSync(`src/assets/textures/${body}.webp.asset.json`, 'utf8'));
      expect(asset.original_filename).toBe(`${body}.webp`);
      expect(asset.size).toBe(source.bytes);
      expect(existsSync(`src/assets/textures/${body}.webp`)).toBe(false);
      expect(sources.filter(row => row.sha256 === source.sha256)).toHaveLength(1);
    });
  }
  it('Titan is a spherical Cassini map, not the 2048×125 ring strip', () => {
    expect(sources.find(row => row.body === 'titan')?.size).toEqual([2048, 1024]);
    expect(sources.find(row => row.body === 'titan')?.downloadUrl).toContain('Titan_ISS_P19658');
  });
  it('Ceres and Phobos use distinct mission products', () => {
    expect(sources.find(row => row.body === 'ceres')?.downloadUrl).toContain('Ceres_HAMO');
    expect(sources.find(row => row.body === 'phobos')?.downloadUrl).toContain('Phobos_Viking');
  });
  it('preserves missing observations rather than inventing terrain', () => {
    for (const body of ['pluto', 'triton', 'europa']) {
      expect(sources.find(row => row.body === body)?.modifications.missingCoverageAlpha).toBe(true);
    }
  });
});