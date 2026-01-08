import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface OrbitalTrailProps {
  objectId: string;
  color: string;
  /** Keep the trail mounted; controls visibility only (prevents trail reset on toggle) */
  enabled?: boolean;
  /** Number of points kept in the trail (lower = faster) */
  maxPoints?: number;
  opacity?: number;
}

/**
 * Lightweight trail for moving objects.
 * 
 * Implementation notes:
 * - Keeps a fixed-size list of points in-order (oldest -> newest)
 * - Uses a single material color/opacity (no per-vertex alpha), to avoid per-frame heavy work
 */
export const OrbitalTrail = ({
  objectId,
  color,
  enabled = true,
  maxPoints = 120,
  opacity = 0.35,
}: OrbitalTrailProps) => {
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);

  const { line, geometry, material, positionAttr, positions } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(maxPoints * 3);
    const attr = new THREE.BufferAttribute(pos, 3);
    geo.setAttribute('position', attr);
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ln = new THREE.Line(geo, mat);
    // Trails can span huge distances; disable frustum culling to avoid "popping"/inconsistent visibility.
    ln.frustumCulled = false;

    return {
      line: ln,
      geometry: geo,
      material: mat,
      positionAttr: attr,
      positions: pos,
    };
  }, [color, maxPoints, opacity]);

  const countRef = useRef(0);
  const lastPosRef = useRef<[number, number, number] | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    geometryRef.current = geometry;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    // If paused, don't keep appending points (prevents "noise" when camera is following)
    if (timeSpeed === 0) return;

    const worldPos = useCosmosStore.getState().objectWorldPositions[objectId];
    if (!worldPos || !geometryRef.current) return;

    // Sample every few frames (cheap throttle)
    frameCountRef.current++;
    if (frameCountRef.current < 4) return;
    frameCountRef.current = 0;

    // Skip tiny movements (e.g. very slow bodies) to keep trail stable
    if (lastPosRef.current) {
      const dx = worldPos[0] - lastPosRef.current[0];
      const dy = worldPos[1] - lastPosRef.current[1];
      const dz = worldPos[2] - lastPosRef.current[2];
      if (dx * dx + dy * dy + dz * dz < 0.01) return;
    }
    lastPosRef.current = [worldPos[0], worldPos[1], worldPos[2]];

    // Shift left by one point (fast typed-array move) and append newest at the end
    // positions layout: [x0,y0,z0, x1,y1,z1, ...]
    positions.copyWithin(0, 3);
    const tail = (maxPoints - 1) * 3;
    positions[tail] = worldPos[0];
    positions[tail + 1] = worldPos[1];
    positions[tail + 2] = worldPos[2];

    // Grow draw range until full
    countRef.current = Math.min(maxPoints, countRef.current + 1);
    geometryRef.current.setDrawRange(0, countRef.current);

    positionAttr.needsUpdate = true;
  });

  return <primitive object={line} visible={enabled} />;
};

