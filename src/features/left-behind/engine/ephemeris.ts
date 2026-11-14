// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as Astronomy from 'astronomy-engine';

export const AU_KM = 149597870.7;
export const DAY_MS = 86400000;
const bodies = {
  mercury: Astronomy.Body.Mercury, venus: Astronomy.Body.Venus, earth: Astronomy.Body.Earth,
  mars: Astronomy.Body.Mars, jupiter: Astronomy.Body.Jupiter, saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus, neptune: Astronomy.Body.Neptune, pluto: Astronomy.Body.Pluto,
};
export type PlanetId = keyof typeof bodies;
export function isEphemerisBody(id: string): id is PlanetId | 'moon' {
  return id === 'moon' || Object.prototype.hasOwnProperty.call(bodies, id);
}
export function helioPositionKm(bodyId: PlanetId, date: Date): [number, number, number] {
  const vector = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECL(), Astronomy.HelioVector(bodies[bodyId], date));
  return [vector.x * AU_KM, vector.y * AU_KM, vector.z * AU_KM];
}
export function moonPositionKm(date: Date): [number, number, number] {
  const earth = helioPositionKm('earth', date);
  const moon = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECL(), Astronomy.GeoMoon(date));
  return [earth[0] + moon.x * AU_KM, earth[1] + moon.y * AU_KM, earth[2] + moon.z * AU_KM];
}
let cachedDate = NaN;
let cachedPositions: Record<string, [number, number, number]> = {};
/** All bodies share one calculation per simulation date, never per mesh. */
export function positionsAt(time: number) {
  if (cachedDate === time) return cachedPositions;
  const date = new Date(time);
  cachedPositions = {};
  for (const id of Object.keys(bodies) as PlanetId[]) cachedPositions[id] = helioPositionKm(id, date);
  cachedPositions.moon = moonPositionKm(date);
  cachedDate = time;
  return cachedPositions;
}
const orbitCache = new Map<PlanetId, [number, number, number][]>();
export function sampleOrbitKm(id: PlanetId, epoch: number): [number, number, number][] {
  const cached = orbitCache.get(id);
  if (cached) return cached;
  const period = Astronomy.PlanetOrbitalPeriod(bodies[id]);
  const points = Array.from({ length: 360 }, (_, i) => helioPositionKm(id, new Date(epoch + period * DAY_MS * i / 359)));
  orbitCache.set(id, points);
  return points;
}