// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect, it } from 'vitest';
import { AU_KM, helioPositionKm, moonPositionKm, sampleOrbitKm } from './ephemeris';
const subtract = (a: number[], b: number[]) => a.map((v, i) => v - (b[i] ?? 0));
const cosine = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0) / (Math.hypot(...a) * Math.hypot(...b));
it('Earth remains about 1 AU from the Sun from 1969 to today', () => {
  for (const year of [1969,1980,2000,2025,2026]) for (const month of [0,3,6,9]) {
    const distance = Math.hypot(...helioPositionKm('earth', new Date(Date.UTC(year,month,1)))) / AU_KM;
    expect(distance).toBeGreaterThan(0.98); expect(distance).toBeLessThan(1.02);
  }
});
it('Moon stays 356000–407000 km from Earth', () => {
  for (let day = 1; day <= 365; day += 5) {
    const date = new Date(Date.UTC(2025,0,day));
    const distance = Math.hypot(...subtract(moonPositionKm(date), helioPositionKm('earth',date)));
    expect(distance).toBeGreaterThan(356000); expect(distance).toBeLessThan(407000);
  }
});
it('Mars stays 1.38–1.67 AU from the Sun', () => {
  for (let day = 1; day <= 700; day += 7) {
    const distance = Math.hypot(...helioPositionKm('mars',new Date(Date.UTC(2025,0,day)))) / AU_KM;
    expect(distance).toBeGreaterThan(1.38); expect(distance).toBeLessThan(1.67);
  }
});
it('Earth lies between Sun and Mars at 16 January 2025 opposition', () => {
  const date = new Date('2025-01-16T00:00:00Z');
  const earth = helioPositionKm('earth',date), mars = helioPositionKm('mars',date);
  expect(cosine(earth,mars)).toBeGreaterThan(0.999);
  expect(Math.hypot(...mars)).toBeGreaterThan(Math.hypot(...earth));
});
it('Moon is opposite the Sun behind Earth during 14 March 2025 eclipse', () => {
  const date = new Date('2025-03-14T07:00:00Z'), earth = helioPositionKm('earth',date);
  expect(cosine(earth,subtract(moonPositionKm(date),earth))).toBeGreaterThan(0.9999);
});
it('memoises 360 orbit points rather than recalculating during scrubbing', () => {
  const points = sampleOrbitKm('earth', Date.UTC(2025,0,1));
  expect(points).toHaveLength(360);
  expect(sampleOrbitKm('earth',Date.UTC(1969,6,1))).toBe(points);
});