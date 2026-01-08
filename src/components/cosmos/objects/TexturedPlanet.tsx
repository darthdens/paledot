import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialObject } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface TexturedPlanetProps {
  object: CelestialObject;
  showOrbit?: boolean;
  visualScale?: number;
  distanceScale?: number;
}

// Planet colors and visual properties
const PLANET_VISUALS: Record<string, {
  baseColor: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness: number;
  metalness: number;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringColor?: string;
  tilt?: number;
}> = {
  sun: {
    baseColor: '#FDB813',
    emissive: '#FF6600',
    emissiveIntensity: 2,
    roughness: 1,
    metalness: 0,
  },
  mercury: {
    baseColor: '#8c7853',
    roughness: 0.9,
    metalness: 0.1,
  },
  venus: {
    baseColor: '#e6c35c',
    roughness: 0.8,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#e6c35c',
  },
  earth: {
    baseColor: '#6b93d6',
    roughness: 0.5,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#4da6ff',
  },
  moon: {
    baseColor: '#c4c4c4',
    roughness: 0.95,
    metalness: 0,
  },
  mars: {
    baseColor: '#c1440e',
    roughness: 0.85,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#d4a574',
  },
  jupiter: {
    baseColor: '#d8ca9d',
    roughness: 0.7,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#e8dcc8',
  },
  io: {
    baseColor: '#f5d742',
    roughness: 0.8,
    metalness: 0.1,
  },
  europa: {
    baseColor: '#c9b896',
    roughness: 0.6,
    metalness: 0.2,
  },
  ganymede: {
    baseColor: '#9e9e9e',
    roughness: 0.85,
    metalness: 0.1,
  },
  callisto: {
    baseColor: '#6b6b6b',
    roughness: 0.9,
    metalness: 0.05,
  },
  saturn: {
    baseColor: '#ead6b8',
    roughness: 0.7,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#f5e6d3',
    hasRings: true,
    ringColor: '#d4b896',
    tilt: 26.7,
  },
  titan: {
    baseColor: '#e8a43c',
    roughness: 0.8,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#f5c366',
  },
  uranus: {
    baseColor: '#d1e7e7',
    roughness: 0.6,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#a8d8d8',
    hasRings: true,
    ringColor: '#8cb8b8',
    tilt: 97.8,
  },
  neptune: {
    baseColor: '#5b5ddf',
    roughness: 0.6,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#7b7dff',
  },
  pluto: {
    baseColor: '#b5a48a',
    roughness: 0.9,
    metalness: 0,
  },
};

export const TexturedPlanet = ({ 
  object, 
  showOrbit = true, 
  visualScale = 80,
  distanceScale = 0.15 
}: TexturedPlanetProps) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const worldPos = useRef(new THREE.Vector3());
  const lastWorldPosUpdate = useRef(0);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);
  const objectWorldPositions = useCosmosStore(state => state.objectWorldPositions);

  // Ensure we have an initial world position early (helps camera fly-to be accurate immediately)
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPos.current);
    setObjectWorldPosition(object.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id, setObjectWorldPosition]);
  
  const visuals = PLANET_VISUALS[object.id] || {
    baseColor: object.color,
    roughness: 0.7,
    metalness: 0.1,
  };
  
  const planetSize = object.size * visualScale;
  const orbitRadius = (object.orbitRadius || 0) * distanceScale;
  const tiltRadians = ((visuals.tilt || 0) * Math.PI) / 180;
  const isMoon = !!object.parentId;

  // For moons, use the real orbit radius scaled into scene units (so orbit paths match motion).
  const moonOrbitRadius = isMoon ? (object.orbitRadius || 0) * distanceScale : 0;


  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Planet rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += (object.rotationSpeed || 0.001) * 0.1;
    }

    if (groupRef.current) {
      // Moons: orbit around their parent planet's world position
      if (isMoon && moonOrbitRadius > 0) {
        const parentPos = objectWorldPositions[object.parentId!];
        if (parentPos) {
          const orbitSpeed = object.orbitSpeed || 0.0001;
          const angle = time * orbitSpeed * 500;
          groupRef.current.position.x = parentPos[0] + Math.cos(angle) * moonOrbitRadius;
          groupRef.current.position.y = parentPos[1];
          groupRef.current.position.z = parentPos[2] + Math.sin(angle) * moonOrbitRadius;
        }
      }
      // Planets: orbit around the Sun (origin) with compressed distances
      else if (orbitRadius > 0 && !isMoon) {
        const orbitSpeed = object.orbitSpeed || 0.00001;
        const angle = time * orbitSpeed * 100;
        groupRef.current.position.x = Math.cos(angle) * orbitRadius;
        groupRef.current.position.z = Math.sin(angle) * orbitRadius;
      }

      // Keep a live world-position for camera targeting (planets/moons move)
      if (time - lastWorldPosUpdate.current > 0.03) {
        lastWorldPosUpdate.current = time;
        groupRef.current.getWorldPosition(worldPos.current);
        setObjectWorldPosition(object.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
      }
    }
    
    // Atmosphere pulse
    if (atmosphereRef.current) {
      const scale = 1 + Math.sin(time * 0.5) * 0.02;
      atmosphereRef.current.scale.setScalar(scale);
    }
  });

  // Create orbit line (only for planets orbiting sun, not moons) with compressed distances
  const orbitPoints = useMemo(() => {
    if (!showOrbit || orbitRadius === 0 || isMoon) return null;
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
  }, [orbitRadius, showOrbit, isMoon]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(object);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(object);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
    document.body.style.cursor = 'default';
  };

  // Initial position with distance compression
  const scaledPosition: [number, number, number] = isMoon 
    ? [object.position[0] * distanceScale, object.position[1], object.position[2] * distanceScale]
    : [object.position[0] * distanceScale, object.position[1], object.position[2] * distanceScale];

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
          <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </line>
      )}

      {/* Planet group */}
      <group ref={groupRef} position={scaledPosition}>
        <group rotation={[tiltRadians, 0, 0]}>
          {/* Main planet sphere */}
          <mesh 
            ref={planetRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[planetSize, 64, 64]} />
            <meshStandardMaterial
              color={visuals.baseColor}
              roughness={visuals.roughness}
              metalness={visuals.metalness}
              emissive={visuals.emissive || '#000000'}
              emissiveIntensity={visuals.emissiveIntensity || 0}
            />
          </mesh>

          {/* Atmosphere glow */}
          {visuals.hasAtmosphere && (
            <mesh ref={atmosphereRef}>
              <sphereGeometry args={[planetSize * 1.05, 32, 32]} />
              <shaderMaterial
                transparent
                depthWrite={false}
                side={THREE.BackSide}
                uniforms={{
                  glowColor: { value: new THREE.Color(visuals.atmosphereColor || '#4da6ff') },
                }}
                vertexShader={`
                  varying vec3 vNormal;
                  void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  varying vec3 vNormal;
                  uniform vec3 glowColor;
                  void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, intensity * 0.4);
                  }
                `}
              />
            </mesh>
          )}

          {/* Rings (Saturn, Uranus) */}
          {visuals.hasRings && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planetSize * 1.3, planetSize * 2.2, 128]} />
              <meshBasicMaterial
                color={visuals.ringColor || '#d4b896'}
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      </group>
    </>
  );
};
