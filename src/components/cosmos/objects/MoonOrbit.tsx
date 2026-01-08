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
  const groupRef = useRef<THREE.Group>(null);

  // Update position to follow parent planet
  useFrame(() => {
    const parentPos = useCosmosStore.getState().objectWorldPositions[parentId];
    if (groupRef.current && parentPos) {
      groupRef.current.position.set(parentPos[0], parentPos[1], parentPos[2]);
    }
  });


  // Create orbit circle points
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 64;
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
  }, [moonOrbitRadius]);

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
