// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { encounterView, flightFrame, lookBackView, pinOffset } from './tourCamera';
import { evaluateTrajectory } from '../engine/trajectory';
import { helioPositionKm, type PlanetId } from '../engine/ephemeris';
import { eclipticKmToScene } from './units';
import { leftBehindTours } from '../data/tours';
import type { Trajectory } from '../data/types';

const track = (id: string) => JSON.parse(readFileSync(`public/left-behind/trajectories/${id}.json`, 'utf8')) as Trajectory;
const RADIUS: Record<string, number> = { jupiter: 69.911, saturn: 58.232, uranus: 25.362, neptune: 24.622 };

describe('tour camera', () => {
  it('One last look points the camera exactly at the Sun, with the craft in front but off-centre', () => {
    const machine = new Vector3(5.9e6, 1.2e6, -8e5), sun = new Vector3(), d = 3e-5;
    const view = lookBackView(machine, sun, d)!;
    const target = machine.clone().add(view.rel), camera = target.clone().add(view.offset);
    const look = target.clone().sub(camera).normalize();
    expect(look.dot(sun.clone().sub(camera).normalize())).toBeCloseTo(1, 9);
    const toCraft = machine.clone().sub(camera).normalize();
    expect(toCraft.dot(look)).toBeGreaterThan(0.7); // in view (within ~45°)
    expect(toCraft.dot(look)).toBeLessThan(0.98); // not covering the Sun
  });

  it('every Voyager flyby keeps its planet centred and the craft in frame at closest approach', () => {
    for (const tour of leftBehindTours.filter(t => t.id.startsWith('voyager'))) {
      for (const stop of tour.stops.filter(s => s.viewMode === 'encounter')) {
        const planet = stop.viewBodyId as PlanetId;
        const from = Date.parse(stop.date!), until = Date.parse(stop.playUntil!);
        const data = track(tour.id);
        const view = encounterView(data, planet, RADIUS[planet]!, from, until)!;
        expect(view, stop.id).not.toBeNull();
        // Closest approach sits inside the window, not at its edges.
        let best = Infinity, at = 0;
        for (let t = from; t <= until; t += 600000) {
          const p = evaluateTrajectory(data, new Date(t))!;
          const r = new Vector3(...eclipticKmToScene(...p.km)).distanceTo(new Vector3(...eclipticKmToScene(...helioPositionKm(planet, new Date(t)))));
          if (r < best) { best = r; at = t; }
        }
        expect(at, stop.id).toBeGreaterThan(from + 6 * 3600000);
        expect(at, stop.id).toBeLessThan(until - 6 * 3600000);
        // From the camera, the craft at closest approach is within the 60° field of view of the planet-centred view.
        const angle = Math.atan(best / view.offset.length()) * 180 / Math.PI;
        expect(angle, stop.id).toBeLessThan(25);
        // The planet is lit: the camera sits on the Sun side.
        const sunDir = new Vector3(...eclipticKmToScene(...helioPositionKm(planet, new Date(at)))).negate().normalize();
        expect(view.offset.clone().normalize().dot(sunDir), stop.id).toBeGreaterThan(0.3);
      }
    }
  });

  it('flights start and end exactly on their views and move without jumps', () => {
    const startTarget = new Vector3(100, 0, 0), endTarget = new Vector3(100.001, 0, 0);
    const startOffset = new Vector3(0, 0, 60), endOffset = pinOffset(new Vector3(1, 0, 0), 5e-5);
    const at = (t: number) => { const f = flightFrame({ t, startTarget, endTarget, startOffset, endOffset }); return f.target.clone().add(f.offset); };
    expect(at(0).distanceTo(startTarget.clone().add(startOffset))).toBeLessThan(1e-9);
    expect(at(1).distanceTo(endTarget.clone().add(endOffset))).toBeLessThan(1e-12);
    // No single 60 fps step moves the camera more than a fraction of its distance to the target.
    for (let i = 0; i < 300; i++) {
      const a = at(i / 300), b = at((i + 1) / 300);
      const range = Math.min(a.distanceTo(startTarget), b.distanceTo(endTarget));
      expect(a.distanceTo(b) / Math.max(range, 1e-12)).toBeLessThan(0.2);
    }
  });

  it('long flights never rush: the scene moves by under a tenth of the viewing distance per frame', () => {
    // Saturn (1990) to Voyager 1 near 40 AU: millions of scene units of travel, ending ~0.1 m-scale.
    const startTarget = new Vector3(-1.2e6, 3e4, 8e5), endTarget = new Vector3(5.9e6, 1.2e6, -8e5);
    const startOffset = new Vector3(900, -600, 700), endOffset = new Vector3(0, 0, 1.2e-4);
    let previous: { target: Vector3; distance: number } | null = null;
    for (let i = 0; i <= 480; i++) {
      const f = flightFrame({ t: i / 480, startTarget, endTarget, startOffset, endOffset });
      if (previous) expect(f.target.distanceTo(previous.target) / Math.min(f.offset.length(), previous.distance)).toBeLessThan(0.1);
      previous = { target: f.target, distance: f.offset.length() };
    }
  });

  it('surface hops between sites stay above the ground', () => {
    const centre = new Vector3(), r = 1.737;
    const a = new Vector3(1, 0.3, 0).normalize(), b = new Vector3(0.6, -0.2, 0.7).normalize();
    const startOffset = pinOffset(a, 3e-5), endOffset = pinOffset(b, 3e-5);
    const startTarget = a.clone().multiplyScalar(r), endTarget = b.clone().multiplyScalar(r);
    for (let i = 0; i <= 200; i++) {
      const f = flightFrame({ t: i / 200, startTarget, endTarget, startOffset, endOffset, sphere: { centre, radius: r } });
      expect(f.target.clone().add(f.offset).length()).toBeGreaterThan(r);
      expect(f.target.length()).toBeCloseTo(r, 9);
    }
  });
});
