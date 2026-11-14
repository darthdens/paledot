// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export const UNIFIED_SCALE = 0.001;
export function eclipticKmToScene(x: number, y: number, z: number): [number, number, number] {
  return [x * UNIFIED_SCALE, z * UNIFIED_SCALE, -y * UNIFIED_SCALE];
}