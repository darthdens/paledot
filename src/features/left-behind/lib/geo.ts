// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
/**
 * Body-fixed position on a sphere mapped like three.js SphereGeometry with an equirectangular
 * texture: u = 0.5 is longitude 0 (+X), east-positive longitude increases u (towards -Z).
 * textureLonOffsetDeg corrects a texture whose centre is not 0° longitude.
 */
export function latLonToLocal(latDeg: number, lonDeg: number, radius: number, textureLonOffsetDeg = 0): [number, number, number] {
  const lat = latDeg * Math.PI / 180, lon = (lonDeg + textureLonOffsetDeg) * Math.PI / 180;
  return [radius * Math.cos(lat) * Math.cos(lon), radius * Math.sin(lat), -radius * Math.cos(lat) * Math.sin(lon)];
}
/** Calibrated against Tycho (Moon) and Olympus Mons (Mars): both textures are centred on 0° longitude. */
export const TEXTURE_LON_OFFSET_DEG: Record<string, number> = { moon: 0, mars: 0 };
