import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialObject } from '../types';

interface PlanetProps {
  object: CelestialObject;
  showOrbit?: boolean;
  scale?: number;
}

export const Planet = ({ object, showOrbit = true, scale = 1 }: PlanetProps) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const planetSize = object.size * scale;
  const orbitRadius = object.orbitRadius || 0;
  const orbitSpeed = object.orbitSpeed || 0;

  // Saturn rings
  const hasRings = object.id === 'saturn';

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Planet rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += (object.rotationSpeed || 0.001) * 0.1;
    }

    // Orbital motion
    if (groupRef.current && orbitRadius > 0) {
      const angle = time * orbitSpeed;
      groupRef.current.position.x = Math.cos(angle) * orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * orbitRadius;
    }
  });

  // Create orbit line
  const orbitPoints = useMemo(() => {
    if (!showOrbit || orbitRadius === 0) return null;
    const points = [];
    const segments = 128;
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
    return points;
  }, [orbitRadius, showOrbit]);

  return (
    <>
      {/* Orbit line */}
      {orbitPoints && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </line>
      )}

      {/* Planet group for orbital motion */}
      <group ref={groupRef} position={object.position}>
        {/* Planet sphere */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[planetSize, 32, 32]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Saturn rings */}
        {hasRings && (
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <ringGeometry args={[planetSize * 1.2, planetSize * 2, 64]} />
            <meshBasicMaterial
              color="#d4b896"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </>
  );
};
