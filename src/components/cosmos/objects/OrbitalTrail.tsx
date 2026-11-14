import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { appendTrailPoint } from '@/features/left-behind/lib/trailBuffer';

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
  /** Minimum squared distance to add a new point (default 0.01, use higher for galaxy scale) */
  minMovementSq?: number;
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
  minMovementSq = 0.01,
}: OrbitalTrailProps) => {
  const groupRef=useRef<THREE.Group>(null);
  const localPoint=useMemo(()=>new THREE.Vector3(),[]);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const glowGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  const lastDate = useRef(useSimClock.getState().simDate);

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
  const wasEnabledRef = useRef(enabled);

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
        glowLine.line.material.dispose();
      }
    };
  }, [geometry, material, glowLine]);

  useFrame(() => {
    const clock = useSimClock.getState();
    const scrubbed = Math.abs(clock.simDate - lastDate.current) > Math.max(60000, clock.rate * 2000);
    lastDate.current = clock.simDate;
    // Clear trail when re-enabled after being disabled (prevents old trail from showing at wrong position)
    if (scrubbed || (enabled && !wasEnabledRef.current)) {
      // Reset trail data
      countRef.current = 0;
      lastPosRef.current = null;
      frameCountRef.current = 0;
      positions.fill(0);
      if (geometryRef.current) {
        geometryRef.current.setDrawRange(0, 0);
        positionAttr.needsUpdate = true;
      }
      if (glowLine && glowGeometryRef.current) {
        glowLine.positions.fill(0);
        glowGeometryRef.current.setDrawRange(0, 0);
        glowLine.positionAttr.needsUpdate = true;
      }
    }
    wasEnabledRef.current = enabled;

    // Only record when enabled and time is moving
    if (!enabled || !clock.isPlaying) return;

    const worldPos = useCosmosStore.getState().objectWorldPositions[objectId];
    if (!worldPos || !geometryRef.current) return;

    // Sample every few frames
    frameCountRef.current++;
    if (frameCountRef.current < 4) return;
    frameCountRef.current = 0;

    // Skip tiny movements (threshold varies by scale)
    if (lastPosRef.current) {
      const dx = worldPos[0] - lastPosRef.current[0];
      const dy = worldPos[1] - lastPosRef.current[1];
      const dz = worldPos[2] - lastPosRef.current[2];
      if (dx * dx + dy * dy + dz * dz < minMovementSq) return;
    }
    lastPosRef.current = [worldPos[0], worldPos[1], worldPos[2]];

    // World-position entries must be transformed back into this line's parent space.
    localPoint.set(...worldPos);groupRef.current?.worldToLocal(localPoint);
    const point:[number,number,number]=[localPoint.x,localPoint.y,localPoint.z];
    const previousCount=countRef.current;
    countRef.current=appendTrailPoint(positions,previousCount,point);
    geometryRef.current.setDrawRange(0, countRef.current);
    positionAttr.needsUpdate = true;

    // Update glow trail (same positions)
    if (glowLine && glowGeometryRef.current) {
      appendTrailPoint(glowLine.positions,previousCount,point);
      glowGeometryRef.current.setDrawRange(0, countRef.current);
      glowLine.positionAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} visible={enabled}>
      <primitive object={line} />
      {glowLine && <primitive object={glowLine.line} />}
    </group>
  );
};
