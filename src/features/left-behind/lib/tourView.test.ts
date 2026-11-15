// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { tourView } from './tourView';
import { leftBehindTours } from '../data/tours';
describe('tour viewpoints', () => {
  it('Voyager 1 looks back in the Sun direction', () => {
    const stop = leftBehindTours.find(t => t.id === 'voyager-1')?.stops.find(s => s.id.endsWith('one-last-look'));
    const machine = new Vector3(100, 20, 5), sun = new Vector3();
    const view = tourView(stop, { sun: [0, 0, 0] }, machine, 0.03);
    expect(view).not.toBeNull();
    if (!view) return;
    const camera = view.target.clone().add(view.offset);
    expect(view.target.clone().sub(camera).normalize().dot(sun.sub(camera).normalize())).toBeCloseTo(1, 10);
  });
  it('every Voyager encounter frames its actual planet and the craft', () => {
    for (const tour of leftBehindTours.filter(t => t.id.startsWith('voyager'))) {
      for (const s of tour.stops.filter(s => ['jupiter', 'saturn', 'uranus', 'neptune'].includes(s.locationId))) {
        expect(s.viewBodyId).toBe(s.locationId);
        const view = tourView(s, { [s.locationId]: [10, 0, 0], sun: [0, 10, 0] }, new Vector3(), 3);
        expect(view?.target.toArray()).toEqual([5, 0, 0]);
        expect(view?.offset.length()).toBeCloseTo(9);
      }
    }
  });
});