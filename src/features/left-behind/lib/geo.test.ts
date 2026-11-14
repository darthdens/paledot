// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { latLonToLocal } from './geo';
// The pin must sit on the sphere vertex whose texture coordinate shows that latitude/longitude.
function vertexAtUv(u: number, v: number) {
  const g = new THREE.SphereGeometry(1, 360, 180), uv = g.getAttribute('uv'), pos = g.getAttribute('position');
  let best = 0, bestD = Infinity;
  for (let i = 0; i < uv.count; i++) { const d = (uv.getX(i) - u) ** 2 + (uv.getY(i) - v) ** 2; if (d < bestD) { bestD = d; best = i; } }
  return new THREE.Vector3(pos.getX(best), pos.getY(best), pos.getZ(best));
}
describe('latLonToLocal', () => {
  for (const [name, lat, lon] of [['Tycho', -43.31, -11.36], ['Olympus Mons', 18.65, -133.8], ['Tranquility Base', 0.67416, 23.47314], ['Jezero', 18.4447, 77.4508]] as const) {
    it(`places ${name} on its texture pixel`, () => {
      const expected = vertexAtUv(0.5 + lon / 360, 0.5 + lat / 180);
      const got = new THREE.Vector3(...latLonToLocal(lat, lon, 1));
      expect(got.distanceTo(expected)).toBeLessThan(0.02);
    });
  }
  it('0° longitude on the equator is +X (the Moon face turned to Earth)', () => {
    expect(latLonToLocal(0, 0, 2)).toEqual([2, 0, -0]);
  });
});
