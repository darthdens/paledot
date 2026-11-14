// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const idx = JSON.parse(readFileSync('public/left-behind/terrain/index.json', 'utf8'));
const hw = JSON.parse(readFileSync('public/left-behind/hardware.json', 'utf8'));
const wrap = (l: number) => ((l + 540) % 360) - 180;

describe('landing-site terrain', () => {
  const pins = hw.machines.flatMap((m: any) => (m.sites ?? []).filter((s: any) => s.lat != null && s.kind !== 'final' || (s.lat != null && m.id === 'lunar-rovers')));
  it.each(pins.map((p: any) => [p.label, p] as [string, any]))('%s has a near and a mid patch containing the pin', (_l: string, p: any) => {
    for (const tier of ['near', 'mid']) {
      const hit = idx.sites.flatMap((s: any) => s.tiers).filter((t: any) => t.tier === tier
        && p.lat >= t.south && p.lat <= t.north && wrap(p.lon) >= t.west && wrap(p.lon) <= t.east);
      expect(hit.length).toBeGreaterThan(0);
      expect(existsSync(`public/left-behind/terrain/${hit[0].file}`)).toBe(true);
    }
  });
  it('every patch names its NASA source and resolution', () => {
    for (const t of idx.sites.flatMap((s: any) => s.tiers)) { expect(t.credit).toMatch(/NASA/); expect(t.sourceMetresPerPixel).toBeGreaterThan(0); }
  });
});
