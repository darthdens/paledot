import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface CometData {
  id: string;
  name: { en: string; fr: string };
  semiMajorAxis: number; // in km
  eccentricity: number;
  inclination: number; // degrees
  orbitalPeriodYears: number;
  color: string;
  coreSize: number; // km
}

// Famous comets with their orbital parameters
export const COMETS: CometData[] = [
  {
    id: 'halley',
    name: { en: "Halley's Comet", fr: 'Comète de Halley' },
    semiMajorAxis: 2.667e9, // ~17.8 AU
    eccentricity: 0.967,
    inclination: 162.3,
    orbitalPeriodYears: 75.3,
    color: '#88ccff',
    coreSize: 11,
  },
  {
    id: 'hale-bopp',
    name: { en: 'Hale-Bopp', fr: 'Hale-Bopp' },
    semiMajorAxis: 2.533e10, // ~186 AU
    eccentricity: 0.995,
    inclination: 89.4,
    orbitalPeriodYears: 2533,
    color: '#aaddff',
    coreSize: 40,
  },
  {
    id: 'encke',
    name: { en: "Encke's Comet", fr: "Comète d'Encke" },
    semiMajorAxis: 3.29e8, // ~2.2 AU
    eccentricity: 0.847,
    inclination: 11.8,
    orbitalPeriodYears: 3.3,
    color: '#ffddaa',
    coreSize: 4.8,
  },
];

interface CometProps {
  comet: CometData;
  scale: number;
}

const Comet = ({ comet, scale }: CometProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Points>(null);
  const ionTailRef = useRef<THREE.Points>(null);
  
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);
  
  const worldPos = useRef(new THREE.Vector3());
  
  // Create tail particles
  const { dustTailPositions, dustTailColors, ionTailPositions, ionTailColors } = useMemo(() => {
    const dustCount = 500;
    const ionCount = 300;
    
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const ionPositions = new Float32Array(ionCount * 3);
    const ionColors = new Float32Array(ionCount * 3);
    
    // Dust tail - curved, yellowish
    for (let i = 0; i < dustCount; i++) {
      const t = i / dustCount;
      const spread = t * 0.5;
      dustPositions[i * 3] = -t * 100 + (Math.random() - 0.5) * spread * 20;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 15;
      dustPositions[i * 3 + 2] = t * 30 + (Math.random() - 0.5) * spread * 10;
      
      const brightness = 1 - t * 0.7;
      dustColors[i * 3] = 1.0 * brightness;
      dustColors[i * 3 + 1] = 0.9 * brightness;
      dustColors[i * 3 + 2] = 0.6 * brightness;
    }
    
    // Ion tail - straight, blue
    for (let i = 0; i < ionCount; i++) {
      const t = i / ionCount;
      const spread = t * 0.2;
      ionPositions[i * 3] = -t * 150 + (Math.random() - 0.5) * spread * 5;
      ionPositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 5;
      ionPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 5;
      
      const brightness = 1 - t * 0.8;
      ionColors[i * 3] = 0.4 * brightness;
      ionColors[i * 3 + 1] = 0.6 * brightness;
      ionColors[i * 3 + 2] = 1.0 * brightness;
    }
    
    return {
      dustTailPositions: dustPositions,
      dustTailColors: dustColors,
      ionTailPositions: ionPositions,
      ionTailColors: ionColors,
    };
  }, []);
  
  // Comet object for selection
  const cometObject = useMemo(() => ({
    id: comet.id,
    name: comet.name,
    type: 'comet' as const,
    position: [0, 0, 0] as [number, number, number],
    size: comet.coreSize,
    color: comet.color,
    distanceFromEarth: comet.semiMajorAxis * (1 - comet.eccentricity),
    distanceUnit: 'AU' as const,
    category: 'solarSystem' as const,
    facts: {
      en: [
        `Orbital period: ${comet.orbitalPeriodYears.toFixed(1)} years`,
        `Eccentricity: ${comet.eccentricity.toFixed(3)}`,
        `Core diameter: ~${comet.coreSize} km`,
      ],
      fr: [
        `Période orbitale: ${comet.orbitalPeriodYears.toFixed(1)} ans`,
        `Excentricité: ${comet.eccentricity.toFixed(3)}`,
        `Diamètre du noyau: ~${comet.coreSize} km`,
      ],
    },
  }), [comet]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime() * timeSpeed * 0.01;
    
    // Elliptical orbit calculation
    const a = comet.semiMajorAxis * scale;
    const e = comet.eccentricity;
    const incl = (comet.inclination * Math.PI) / 180;
    
    // Mean anomaly (simplified - would need Kepler equation for accuracy)
    const M = (time / comet.orbitalPeriodYears) * Math.PI * 2;
    
    // Approximate true anomaly (good enough for visualization)
    const E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    
    // Distance from sun
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
    
    // Position in orbital plane
    const x = r * Math.cos(trueAnomaly);
    const z = r * Math.sin(trueAnomaly);
    
    // Apply inclination
    const y = z * Math.sin(incl);
    const zInclined = z * Math.cos(incl);
    
    groupRef.current.position.set(x, y, zInclined);
    
    // Point tail away from sun
    const sunDir = new THREE.Vector3(-x, -y, -zInclined).normalize();
    if (tailRef.current) {
      tailRef.current.lookAt(sunDir.multiplyScalar(100).add(groupRef.current.position));
    }
    if (ionTailRef.current) {
      ionTailRef.current.lookAt(sunDir.clone().multiplyScalar(100).add(groupRef.current.position));
    }
    
    // Update world position for camera targeting
    groupRef.current.getWorldPosition(worldPos.current);
    setObjectWorldPosition(comet.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    
    // Animate core glow based on distance from sun
    if (coreRef.current) {
      const distFromSun = r / a;
      const glowIntensity = Math.max(0.5, 2 - distFromSun);
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, glowIntensity);
    }
  });
  
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(cometObject);
  };
  
  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(cometObject);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHoveredObject(null);
    document.body.style.cursor = 'default';
  };
  
  const coreSize = Math.max(comet.coreSize * scale * 50, 2); // Exaggerated for visibility
  
  return (
    <group ref={groupRef}>
      {/* Comet core */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[coreSize, 16, 16]} />
        <meshBasicMaterial color={comet.color} />
      </mesh>
      
      {/* Coma (fuzzy glow around core) */}
      <mesh>
        <sphereGeometry args={[coreSize * 3, 16, 16]} />
        <meshBasicMaterial
          color={comet.color}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      
      {/* Dust tail */}
      <points ref={tailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustTailPositions.length / 3}
            array={dustTailPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={dustTailColors.length / 3}
            array={dustTailColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={coreSize * 0.5}
          vertexColors
          transparent
          opacity={0.6}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      
      {/* Ion tail */}
      <points ref={ionTailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={ionTailPositions.length / 3}
            array={ionTailPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={ionTailColors.length / 3}
            array={ionTailColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={coreSize * 0.3}
          vertexColors
          transparent
          opacity={0.5}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

interface CometsProps {
  scale: number;
}

export const Comets = ({ scale }: CometsProps) => {
  return (
    <group>
      {COMETS.map((comet) => (
        <Comet key={comet.id} comet={comet} scale={scale} />
      ))}
    </group>
  );
};
