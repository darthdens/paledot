import { useMemo } from 'react';
import * as THREE from 'three';
import { UNITS } from '../types';

interface GalacticOrbitRingProps {
  visualScale: number;
  visible?: boolean;
}

// Must match MilkyWayGalaxy parameters
const MILKY_WAY = {
  sunDistance: 26000, // light years from galactic center
  sunAngle: Math.PI * 0.72,
};

/**
 * A static ring showing the solar system's orbital path around the galactic center.
 * This is rendered outside the GalaxyRotator so it stays fixed while the galaxy rotates.
 */
export const GalacticOrbitRing = ({ visualScale, visible = true }: GalacticOrbitRingProps) => {
  const gs = UNITS.KM_PER_LY * visualScale;
  const orbitRadius = MILKY_WAY.sunDistance * gs;

  // Galaxy center position (offset from solar system at origin)
  const galaxyCenter = useMemo<[number, number, number]>(
    () => [
      -Math.cos(MILKY_WAY.sunAngle) * orbitRadius,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * orbitRadius,
    ],
    [orbitRadius]
  );

  // Create a dashed ring geometry
  const ringGeometry = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        )
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [orbitRadius]);

  if (!visible) return null;

  return (
    <group position={galaxyCenter}>
      {/* Main orbit ring */}
      <primitive object={new THREE.Line(ringGeometry, new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))} />

      {/* Current position marker at origin relative to this group = solar system position on the ring */}
      <mesh
        position={[
          Math.cos(MILKY_WAY.sunAngle) * orbitRadius,
          0,
          Math.sin(MILKY_WAY.sunAngle) * orbitRadius,
        ]}
      >
        <sphereGeometry args={[orbitRadius * 0.01, 16, 16]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
