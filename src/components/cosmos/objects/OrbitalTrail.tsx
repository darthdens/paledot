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
  /** Line thickness in scene units (default 1) */
  lineWidth?: number;
  /** Add a glow layer behind the trail */
  glow?: boolean;
}

/**
 * Lightweight trail for moving objects.
 * Uses tube geometry for visible thickness (WebGL ignores lineWidth on most platforms).
 */
export const OrbitalTrail = ({
  objectId,
  color,
  enabled = true,
  maxPoints = 120,
  opacity = 0.35,
  lineWidth = 1,
  glow = false,
}: OrbitalTrailProps) => {
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const glowGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  const timeSpeed = useCosmosStore((state) => state.timeSpeed);

  // Main trail line
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
      linewidth: lineWidth, // Note: ignored on most WebGL implementations
    });

    const ln = new THREE.Line(geo, mat);
    ln.frustumCulled = false;

    return {
      line: ln,
      geometry: geo,
      material: mat,
      positionAttr: attr,
      positions: pos,
    };
  }, [color, maxPoints, opacity, lineWidth]);

  // Glow layer (thicker, more transparent)
  const glowLine = useMemo(() => {
    if (!glow) return null;

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(maxPoints * 3);
    const attr = new THREE.BufferAttribute(pos, 3);
    geo.setAttribute('position', attr);
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity * 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ln = new THREE.Line(geo, mat);
    ln.frustumCulled = false;
    ln.renderOrder = -1;

    return { line: ln, geometry: geo, positionAttr: attr, positions: pos };
  }, [color, maxPoints, opacity, glow]);

  const countRef = useRef(0);
  const lastPosRef = useRef<[number, number, number] | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    geometryRef.current = geometry;
    if (glowLine) {
      glowGeometryRef.current = glowLine.geometry;
    }
    return () => {
      geometry.dispose();
      material.dispose();
      if (glowLine) {
        glowLine.geometry.dispose();
      }
    };
  }, [geometry, material, glowLine]);

  useFrame(() => {
    if (timeSpeed === 0) return;

    const worldPos = useCosmosStore.getState().objectWorldPositions[objectId];
    if (!worldPos || !geometryRef.current) return;

    // Sample every few frames
    frameCountRef.current++;
    if (frameCountRef.current < 4) return;
    frameCountRef.current = 0;

    // Skip tiny movements
    if (lastPosRef.current) {
      const dx = worldPos[0] - lastPosRef.current[0];
      const dy = worldPos[1] - lastPosRef.current[1];
      const dz = worldPos[2] - lastPosRef.current[2];
      if (dx * dx + dy * dy + dz * dz < 0.01) return;
    }
    lastPosRef.current = [worldPos[0], worldPos[1], worldPos[2]];

    // Update main trail
    positions.copyWithin(0, 3);
    const tail = (maxPoints - 1) * 3;
    positions[tail] = worldPos[0];
    positions[tail + 1] = worldPos[1];
    positions[tail + 2] = worldPos[2];

    countRef.current = Math.min(maxPoints, countRef.current + 1);
    geometryRef.current.setDrawRange(0, countRef.current);
    positionAttr.needsUpdate = true;

    // Update glow trail (same positions)
    if (glowLine && glowGeometryRef.current) {
      glowLine.positions.copyWithin(0, 3);
      glowLine.positions[tail] = worldPos[0];
      glowLine.positions[tail + 1] = worldPos[1];
      glowLine.positions[tail + 2] = worldPos[2];
      glowGeometryRef.current.setDrawRange(0, countRef.current);
      glowLine.positionAttr.needsUpdate = true;
    }
  });

  return (
    <group visible={enabled}>
      <primitive object={line} />
      {glowLine && <primitive object={glowLine.line} />}
    </group>
  );
};
