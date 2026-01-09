import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useLanguage } from '@/i18n/LanguageContext';

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
 * A ring showing the solar system's orbital path around the galactic center.
 */
export const GalacticOrbitRing = ({ visualScale, visible = true }: GalacticOrbitRingProps) => {
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

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
      points.push(new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [orbitRadius]);

  if (!visible) return null;

  return (
    <group position={galaxyCenter}>
      {/* Main orbit ring */}
      <primitive
        object={
          new THREE.Line(
            ringGeometry,
            new THREE.LineBasicMaterial({
              color: 0x00ff88,
              transparent: true,
              opacity: 0.6,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          )
        }
      />

      {/* Current position marker on the ring */}
      <mesh
        position={[markerX, 0, markerZ]}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[markerRadius, 16, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Vertical line connecting marker to label */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              markerX, markerRadius, markerZ,
              markerX, markerRadius * 10, markerZ,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </line>

      {/* Tooltip label - always visible, positioned well above the marker */}
      <Html
        position={[markerX, markerRadius * 12, markerZ]}
        center
        occlude={false}
        // Keep this label beneath app modals/overlays (e.g., Help & Controls)
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-500/50 whitespace-nowrap">
          <span className="text-emerald-400 text-sm font-semibold">
            {language === 'fr' ? 'Nous sommes ici' : 'We are here'}
          </span>
        </div>
      </Html>
    </group>
  );
};

