// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';
import { decodeHeightImage, heightAtM, heightTexture, reliefSync, sampleGrid } from '@/components/cosmos/lib/relief';
import { getTerrainIndex, terrainImageUrl, type TerrainTier } from '../data/dataClient';

/**
 * Real metre-level heights around landing sites (LROC NAC / HiRISE DTMs; see terrain/index.json heightSource),
 * on each near tier's lat/lon box. Values are metres relative to tier.heightBaseM, rows south to north.
 */
export type SiteHeights = { tier: TerrainTier; width: number; height: number; data: Float32Array; texture: THREE.DataTexture };
const cache = new Map<string, Promise<SiteHeights>>();
const ready: SiteHeights[] = [];

export function loadSiteHeights(tier: TerrainTier): Promise<SiteHeights> {
  const file = tier.heightFile!;
  let p = cache.get(file);
  if (!p) {
    p = decodeHeightImage(terrainImageUrl(file)).then(({ width, height, values }) => {
      const data = new Float32Array(values.length), scale = tier.heightScaleM ?? 0.1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = values[(height - 1 - y) * width + x]! * scale;
      const h: SiteHeights = { tier, width, height, data, texture: heightTexture(width, height, data) };
      h.texture.wrapS = THREE.ClampToEdgeWrapping; ready.push(h); return h;
    });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return p;
}

let indexRequested = false;
/** Starts loading every site's heights for a body once its global relief is in use. */
export function preloadSiteHeights(body: 'moon' | 'mars') {
  if (indexRequested) return; indexRequested = true;
  void getTerrainIndex().then(idx => idx.sites.forEach(s => s.tiers.forEach(t => { if (t.heightFile) void loadSiteHeights(t).catch(() => {}); }))).catch(() => { indexRequested = false; });
  void body;
}

/** Real ground height (metres) at lat/lon: site DTM where loaded, else the global map, else 0 (flat body). */
export function groundHeightM(body: 'moon' | 'mars', lat: number, lon: number) {
  if (!reliefSync(body)) return 0;
  const L = ((lon + 540) % 360) - 180;
  for (const h of ready) {
    const t = h.tier;
    if (lat < t.south || lat > t.north || L < t.west || L > t.east) continue;
    return (t.heightBaseM ?? 0) + sampleGrid(h.data, h.width, h.height, (L - t.west) / (t.east - t.west), (lat - t.south) / (t.north - t.south), false);
  }
  return heightAtM(body, lat, lon);
}
export function siteHeightsFor(tier: TerrainTier) { return ready.find(h => h.tier.file === tier.file || h.tier.heightFile === tier.heightFile && tier.heightFile !== undefined); }
