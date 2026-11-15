// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Vector3 } from 'three';
import type { TourStop } from '@/components/cosmos/types';

type Positions = Record<string, [number, number, number]>;
/** Editorial camera framing from the same dated world positions, not spacecraft attitude telemetry. */
export function tourView(stop: TourStop | undefined, positions: Positions, machine: Vector3, distance: number) {
  if (!stop?.viewBodyId) return null;
  const body = positions[stop.viewBodyId];
  if (!body) return null;
  const toward = new Vector3(...body).sub(machine);
  if (toward.lengthSq() < 1e-20) return null;
  if (stop.viewMode === 'look-back') {
    toward.normalize();
    return { target: machine.clone().addScaledVector(toward, distance * 2), offset: toward.multiplyScalar(-distance) };
  }
  const target = machine.clone().addScaledVector(toward, 0.5);
  const sun = positions.sun ?? [0, 0, 0];
  const lit = new Vector3(...sun).sub(target).normalize();
  const side = toward.clone().normalize().cross(lit);
  if (side.lengthSq() < 1e-10) side.set(0, 1, 0);
  side.normalize();
  const range = Math.max(distance, toward.length() * 0.9);
  return { target, offset: lit.multiplyScalar(range * 0.8).addScaledVector(side, range * 0.6) };
}