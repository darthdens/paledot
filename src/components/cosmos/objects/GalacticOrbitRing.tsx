import { useMemo, useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '../store/useCosmosStore';

interface GalacticOrbitRingProps {
  visualScale: number;
  visible?: boolean;
}

// Must match MilkyWayGalaxy parameters
const MILKY_WAY = {
  sunDistance: 26000, // light years from galactic center
  sunAngle: Math.PI * 0.72,
};

// Fade duration in seconds
const FADE_DURATION = 1.0;

/**
 * A ring showing the solar system's orbital path around the galactic center.
 * Only visible at stellar scale and above (not in solar system view).
 * Fades smoothly when transitioning between scales.
 */
export const GalacticOrbitRing = ({ visualScale, visible = true }: GalacticOrbitRingProps) => {
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const currentOpacity = useRef(0);
  const ringMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const markerMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  // Only show at stellar scale and above, and NOT when inside any star system
  const currentScale = useCosmosStore((s) => s.currentScale);
  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  const showAtScale =
    (currentScale === 'stellar' ||
      currentScale === 'milkyWay' ||
      currentScale === 'localGroup' ||
      currentScale === 'universe') &&
    !isInStarSystem;

  // Target opacity based on visibility and scale
  const targetOpacity = visible && showAtScale ? 1 : 0;

  const gs = UNITS.KM_PER_LY * visualScale;
  const orbitRadius = MILKY_WAY.sunDistance * gs;
  const markerRadius = orbitRadius * 0.01;

  // Galaxy center position (offset from solar system at origin)
  const galaxyCenter = useMemo<[number, number, number]>(
    () => [
      -Math.cos(MILKY_WAY.sunAngle) * orbitRadius,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * orbitRadius,
    ],
    [orbitRadius]
  );

  const markerX = Math.cos(MILKY_WAY.sunAngle) * orbitRadius;
  const markerZ = Math.sin(MILKY_WAY.sunAngle) * orbitRadius;

  // Create a dashed ring geometry
  const ringGeometry = useMemo(() => {
    const segments = 128;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius)
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [orbitRadius]);

  // Smooth opacity transition
  useFrame((_, delta) => {
    const diff = targetOpacity - currentOpacity.current;
    const step = delta / FADE_DURATION;

    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += Math.sign(diff) * Math.min(Math.abs(diff), step);
    } else {
      currentOpacity.current = targetOpacity;
    }

    const opacity = currentOpacity.current;

    // Update material opacities
    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = opacity * 0.6;
    }
    if (markerMaterialRef.current) {
      markerMaterialRef.current.opacity = opacity * 0.8;
    }
    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = opacity * 0.6;
    }
  });

  // Always render but control via opacity (allows smooth fade)
  const isVisible = currentOpacity.current > 0.001 || targetOpacity > 0;

  if (!isVisible) return null;

  return (
    <group position={galaxyCenter}>
      {/* Main orbit ring removed - keeping only marker, line and label */}

      {/* Current position marker on the ring */}
      <mesh
        position={[markerX, 0, markerZ]}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[markerRadius, 16, 16]} />
        <meshBasicMaterial
          ref={markerMaterialRef}
          color="#00ff88"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Vertical line connecting marker to label */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              markerX,
              markerRadius,
              markerZ,
              markerX,
              markerRadius * 10,
              markerZ,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMaterialRef} color="#00ff88" transparent opacity={0} />
      </line>

      {/* Tooltip label - always visible when ring is visible */}
      {currentOpacity.current > 0.1 && (
        <Html
          position={[markerX, markerRadius * 12, markerZ]}
          center
          occlude={false}
          zIndexRange={[0, 0]}
          style={{
            pointerEvents: 'none',
            opacity: currentOpacity.current,
            transition: 'opacity 0.1s ease-out',
          }}
        >
          <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
            <span className="text-white text-sm font-semibold">
              {language === 'fr' ? 'Nous sommes ici' : 'We are here'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
