// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';
import earthHeight from '@/assets/relief/earth-height.webp.asset.json';
import moonHeight from '@/assets/relief/moon-height.webp.asset.json';
import marsHeight from '@/assets/relief/mars-height.webp.asset.json';
import mercuryHeight from '@/assets/relief/mercury-height.webp.asset.json';
import ceresHeight from '@/assets/relief/ceres-height.webp.asset.json';
import meta from '@/assets/relief/relief.json';

/**
 * True-scale global relief (real elevation data, metres): Moon LRO LOLA, Mars MGS MOLA, Earth NOAA ETOPO1,
 * Mercury MESSENGER (USGS DEM), Ceres Dawn (DLR HAMO DTM).
 * Built by scripts/relief/build_globals.py. Loaded once the camera nears the body, never at boot.
 * Encoding: equirectangular, north up, lon -180..180; (metres + 32768) split into R (high) and G (low).
 */
const URLS: Record<string, string> = { earth: earthHeight.url, moon: moonHeight.url, mars: marsHeight.url, mercury: mercuryHeight.url, ceres: ceresHeight.url };
export const METRE = 1e-6; // scene units per metre (1 unit = 1000 km)
export const RELIEF_NEAR_RADII = 60;

export type Relief = { width: number; height: number; data: Float32Array; texture: THREE.DataTexture; maxM: number };
const cache = new Map<string, Promise<Relief>>();
const ready = new Map<string, Relief>();

export function hasRelief(id: string) { return id in URLS; }
export function reliefSync(id: string) { return ready.get(id); }
export function reliefMeta(id: string) { return (meta as Record<string, { credit: string; sourceUrl: string }>)[id]; }

/** Decodes a lossless WebP whose R/G bytes hold (value + 32768); returns signed values. */
export async function decodeHeightImage(url: string): Promise<{ width: number; height: number; values: Float32Array }> {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(bmp.width, bmp.height) : Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bmp, 0, 0);
  const px = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  const values = new Float32Array(bmp.width * bmp.height);
  for (let i = 0, j = 0; i < values.length; i++, j += 4) values[i] = ((px[j]! << 8) | px[j + 1]!) - 32768;
  bmp.close();
  return { width: canvas.width, height: canvas.height, values };
}

/** Half-float, linearly filtered single-channel texture (metres). */
export function heightTexture(width: number, height: number, values: Float32Array) {
  const half = new Uint16Array(values.length);
  for (let i = 0; i < values.length; i++) half[i] = THREE.DataUtils.toHalfFloat(values[i]!);
  const tex = new THREE.DataTexture(half, width, height, THREE.RedFormat, THREE.HalfFloatType);
  tex.flipY = false; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}

export function loadRelief(id: string): Promise<Relief> {
  let p = cache.get(id);
  if (!p) {
    const url = URLS[id];
    if (!url) return Promise.reject(new Error('no relief'));
    p = decodeHeightImage(url).then(({ width, height, values }) => {
      // Image rows run north to south; flip so v = 1 is north like SphereGeometry uvs.
      const data = new Float32Array(values.length);
      for (let y = 0; y < height; y++) data.set(values.subarray((height - 1 - y) * width, (height - y) * width), y * width);
      // Earth: oceans are drawn at their surface (sea level); ETOPO's sea floor stays in the data, not the globe.
      if (id === 'earth') for (let i = 0; i < data.length; i++) if (data[i]! < 0) data[i] = 0;
      let maxM = 0; for (let i = 0; i < data.length; i++) if (data[i]! > maxM) maxM = data[i]!;
      const r: Relief = { width, height, data, texture: heightTexture(width, height, data), maxM };
      ready.set(id, r);
      return r;
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

/** Bilinear sample of a north-up-flipped (v = 1 north) grid at texture coordinates. */
export function sampleGrid(data: Float32Array, width: number, height: number, u: number, v: number, wrap = true) {
  let x = u * width - 0.5, y = v * height - 0.5;
  if (!wrap) x = Math.min(Math.max(x, 0), width - 1);
  y = Math.min(Math.max(y, 0), height - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, y1 = Math.min(y0 + 1, height - 1);
  const wx = (i: number) => wrap ? ((i % width) + width) % width : Math.min(Math.max(i, 0), width - 1);
  const a = data[y0 * width + wx(x0)]!, b = data[y0 * width + wx(x0 + 1)]!, c = data[y1 * width + wx(x0)]!, d = data[y1 * width + wx(x0 + 1)]!;
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** Real elevation in metres at lat/lon (east-positive degrees), or 0 until the body's relief has loaded. */
export function heightAtM(id: string, latDeg: number, lonDeg: number) {
  const r = ready.get(id); if (!r) return 0;
  return sampleGrid(r.data, r.width, r.height, (lonDeg + 180) / 360, (latDeg + 90) / 180);
}

/** GLSL: displacement + per-fragment normals from the height map (shared by bodies and site caps). */
export const RELIEF_GLSL = /* glsl */`
  vec3 reliefPerturb(vec3 n, vec3 east, sampler2D hm, vec2 uv, vec2 texel, vec2 metresPerUv) {
    float hL = texture2D(hm, uv - vec2(texel.x, 0.0)).r, hR = texture2D(hm, uv + vec2(texel.x, 0.0)).r;
    float hD = texture2D(hm, uv - vec2(0.0, texel.y)).r, hU = texture2D(hm, uv + vec2(0.0, texel.y)).r;
    vec2 g = vec2((hR - hL) / (2.0 * texel.x * metresPerUv.x), (hU - hD) / (2.0 * texel.y * metresPerUv.y));
    vec3 e = normalize(east - n * dot(east, n)), nn = cross(n, e);
    return normalize(n - e * g.x - nn * g.y);
  }
`;
