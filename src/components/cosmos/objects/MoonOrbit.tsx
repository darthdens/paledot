import { useSimClock } from '@/features/left-behind/state/useSimClock';
import { getEphemeris } from '@/features/left-behind/engine/runtime';
import { eclipticKmToScene } from '@/features/left-behind/lib/units';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

interface MoonOrbitProps {
  parentId: string;
  moonOrbitRadius: number;
  color?: string;
}

export const MoonOrbit = ({ parentId, moonOrbitRadius, color = '#ffffff' }: MoonOrbitProps) => {
  const orbitEpoch = useSimClock(s => Math.floor(s.simDate / 86400000 / 27.32));
  const groupRef = useRef<THREE.Group>(null);

  // Update position to follow parent planet
  useFrame(() => {
    const parentKm = getEphemeris()?.positionsAt(useSimClock.getState().simDate)[parentId];
    const parentPos = parentKm ? eclipticKmToScene(...parentKm) : null;
    if (groupRef.current && parentPos) {
      groupRef.current.position.set(parentPos[0], parentPos[1], parentPos[2]);
    }
  });


  // Create orbit circle points
  const orbitPoints = useMemo(() => {
    const ephemeris = getEphemeris();
    if (parentId === 'earth' && ephemeris) return ephemeris.sampleMoonOrbitKm(orbitEpoch * 27.32 * 86400000).map(p => new THREE.Vector3(...eclipticKmToScene(...p)));
    const points = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * moonOrbitRadius,
          0,
          Math.sin(angle) * moonOrbitRadius
        )
      );
    }
    return points;
  }, [moonOrbitRadius, parentId, orbitEpoch]);

  return (
    <group ref={groupRef}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.15} />
      </line>
    </group>
  );
};
