// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
// Camera views and flights for machine follows and Left Behind tours. Editorial framing from dated
// positions (JPL Horizons tracks, astronomy-engine planets), never spacecraft attitude telemetry.
import { Quaternion, Vector3 } from 'three';
import { evaluateTrajectory } from '../engine/trajectory';
import { helioPositionKm, type PlanetId } from '../engine/ephemeris';
import { eclipticKmToScene } from './units';
import type { Trajectory } from '../data/types';

export type Anchor = { kind: 'hw'; id: string } | { kind: 'body'; id: string } | { kind: 'fixed'; point: Vector3 };
/** A followed view: orbit target = anchor + rel, camera = target + offset. */
export type CameraView = { anchor: Anchor; rel: Vector3; offset: Vector3 };
/** Surface hop between two sites on one body (scene units, live each frame). */
export type Sphere = { centre: Vector3; radius: number };

const smoother = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const MAX_BUMP_DISTANCE = 5e6; // ~33 AU: stays within Solar System scale so planets and markers stay mounted

/** Unit-vector slerp that tolerates opposite directions. */
export function slerpUnit(a: Vector3, b: Vector3, t: number, out = new Vector3()) {
  const q = new Quaternion().setFromUnitVectors(a, b);
  return out.copy(a).applyQuaternion(new Quaternion().slerp(q, t)).normalize();
}

/** Extra log-distance at mid-flight so far-apart start and end both fit in view (zoom out, travel, zoom in). */
export function flightBump(separation: number, d0: number, d1: number) {
  if (!(separation > 0)) return 0;
  const mean = Math.exp((Math.log(d0) + Math.log(d1)) / 2);
  const wanted = Math.min(separation * 0.7, MAX_BUMP_DISTANCE);
  return Math.max(0, Math.log(wanted / Math.max(mean, 1e-12)));
}

/** Seconds: longer for bigger zoom ratios, wider travel and longer surface hops. */
export function flightDuration(d0: number, d1: number, bump: number, hopAngle = 0) {
  return Math.min(7, Math.max(2.2, 2.2 + 0.22 * Math.abs(Math.log(Math.max(d1, 1e-12) / Math.max(d0, 1e-12))) + 0.45 * bump + 2.5 * hopAngle));
}

export type FlightInput = { t: number; startTarget: Vector3; endTarget: Vector3; startOffset: Vector3; endOffset: Vector3; bump: number; sphere?: Sphere };
/**
 * One flight frame. Zooming in turns the view first and descends after; zooming out climbs first and turns after,
 * so the camera never swings through a body at close range. Distance is interpolated in log space.
 */
export function flightFrame({ t, startTarget, endTarget, startOffset, endOffset, bump, sphere }: FlightInput) {
  const d0 = Math.max(startOffset.length(), 1e-12), d1 = Math.max(endOffset.length(), 1e-12);
  const zoomIn = d1 < d0;
  const eDir = zoomIn ? smoother(t / 0.6) : smoother((t - 0.4) / 0.6);
  const eDist = zoomIn ? smoother((t - 0.25) / 0.75) : smoother(t / 0.75);
  const eTarget = smoother(t);
  const arch = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  const distance = Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * eDist + bump * arch * arch);
  const direction = slerpUnit(startOffset.clone().divideScalar(d0), endOffset.clone().divideScalar(d1), eDir);
  let target: Vector3, up: Vector3 | null = null;
  if (sphere) {
    const a = startTarget.clone().sub(sphere.centre), b = endTarget.clone().sub(sphere.centre);
    const ra = a.length(), rb = b.length();
    const radial = slerpUnit(a.normalize(), b.normalize(), eTarget);
    target = sphere.centre.clone().addScaledVector(radial, ra + (rb - ra) * eTarget);
    // Mid-hop: ride behind and above the ground track, looking ahead along the way.
    const ahead = b.clone().sub(radial.clone().multiplyScalar(b.dot(radial)));
    if (ahead.lengthSq() > 1e-12) ahead.normalize();
    const hop = radial.clone().addScaledVector(ahead, -0.8).normalize();
    direction.multiplyScalar(1 - arch).addScaledVector(hop, arch).normalize();
    up = radial;
  } else target = startTarget.clone().lerp(endTarget, eTarget);
  return { target, offset: direction.multiplyScalar(distance), up };
}

/** Oblique view over a landed pin: above the local ground and to one side, so the horizon stays level. */
export function pinOffset(normal: Vector3, distance: number) {
  const side = new Vector3(0, 1, 0).cross(normal);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  side.normalize();
  return normal.clone().multiplyScalar(distance * 0.6).addScaledVector(side, distance * 0.8);
}

/** Default view on a machine in space: slightly above the ecliptic, offset sideways. */
export function spaceOffset(distance: number) { return new Vector3(distance * 0.5, distance * 0.3, distance); }

/**
 * "One last look": camera behind and beside the craft, looking exactly along craft→Sun,
 * so the Sun sits at the centre of the view with the craft in the foreground.
 */
export function lookBackView(machine: Vector3, sun: Vector3, distance: number) {
  const toSun = sun.clone().sub(machine);
  if (toSun.lengthSq() < 1e-20) return null;
  toSun.normalize();
  const up = new Vector3(0, 1, 0);
  const side = toSun.clone().cross(up);
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();
  const lift = side.clone().cross(toSun).normalize();
  const camera = toSun.clone().multiplyScalar(-1.2 * distance).addScaledVector(side, 0.7 * distance).addScaledVector(lift, 0.35 * distance);
  const offset = toSun.clone().multiplyScalar(-4 * distance);
  return { rel: camera.clone().sub(offset), offset };
}

/**
 * Planet flyby: the planet stays centred and lit, and the craft crosses the frame on its real track.
 * Camera looks down on the flyby plane, tilted toward the Sun, at a distance that shows the closest approach.
 */
export function encounterView(track: Trajectory, planet: PlanetId, planetRadius: number, from: number, until: number, samples = 96) {
  if (!(until > from)) return null;
  let closest = Infinity, closestRel: Vector3 | null = null;
  const rels: Vector3[] = [];
  for (let i = 0; i <= samples; i++) {
    const date = new Date(from + (until - from) * i / samples);
    const p = evaluateTrajectory(track, date);
    if (!p) continue;
    const rel = new Vector3(...eclipticKmToScene(...p.km)).sub(new Vector3(...eclipticKmToScene(...helioPositionKm(planet, date))));
    rels.push(rel);
    if (rel.length() < closest) { closest = rel.length(); closestRel = rel; }
  }
  const first = rels[0], last = rels.at(-1);
  if (!first || !last || !closestRel) return null;
  const normal = first.clone().cross(last);
  if (normal.lengthSq() < 1e-12) normal.copy(first).cross(new Vector3(0, 1, 0));
  if (normal.lengthSq() < 1e-12) normal.set(0, 1, 0);
  normal.normalize();
  const mid = new Date((from + until) / 2);
  const sun = new Vector3(...eclipticKmToScene(...helioPositionKm(planet, mid))).multiplyScalar(-1).normalize();
  if (normal.dot(sun) < 0) normal.negate();
  const direction = normal.add(sun).normalize();
  const distance = Math.max(closest * 4, planetRadius * 10);
  return { rel: new Vector3(), offset: direction.multiplyScalar(distance), closest };
}
