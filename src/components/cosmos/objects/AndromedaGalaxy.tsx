import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getAndromedaGlowTexture } from '../utils/sharedTextures';
import { LODController } from '../utils/lodManager';

interface AndromedaGalaxyProps {
  visualScale: number;
}

const ANDROMEDA = {
  diskRadius: 110000,
  bulgeRadius: 20000,
  branches: 2,
  spinTurns: 1.4,
  inclination: (77 * Math.PI) / 180,
  distanceFromMilkyWay: 2.537e6,
};

export const AndromedaGalaxy = ({ visualScale }: AndromedaGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const frameCountRef = useRef(0);
  const lodControllerRef = useRef(new LODController('high'));

  const { camera } = useThree();
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  const diskR = ANDROMEDA.diskRadius * gs;

  // Bump this whenever we tweak star generation so Fast Refresh recomputes geometries
  const GEOMETRY_VERSION = 2;

  const andromedaPosition = useMemo<[number, number, number]>(
    () => [
      ANDROMEDA.distanceFromMilkyWay * gs * 0.7,
      ANDROMEDA.distanceFromMilkyWay * gs * 0.15,
      ANDROMEDA.distanceFromMilkyWay * gs * 0.7,
    ],
    [gs]
  );

  const andromedaObject = useMemo(() => getObjectById('andromeda'), []);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (andromedaObject) setSelectedObject(andromedaObject);
    },
    [andromedaObject, setSelectedObject]
  );

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getAndromedaGlowTexture(), []);

  // Full-res geometries
  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = ANDROMEDA;
    const maxRadius = ANDROMEDA.diskRadius * gs;
    const starCount = 700000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    // Seeded random for consistent geometry
    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const k = 4.5;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const u = seededRandom();
      const t = -Math.log(1 - u * denom) / k;

      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(seededRandom() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      const spinAngle = rt * spinTurns * Math.PI * 2;

      const armWidth = 0.12 + rt * 0.2;
      const armJitter = (seededRandom() + seededRandom() + seededRandom() - 1.5) * armWidth;
      const isInterArm = seededRandom() < 0.45;
      const interArmJitter = isInterArm ? (seededRandom() - 0.5) * (1.0 + rt * 0.7) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.06 + rt * 0.12) * maxRadius;
      const radialJitter = (seededRandom() + seededRandom() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.015 + rt * 0.025;
      const yJitter =
        (seededRandom() + seededRandom() + seededRandom() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = seededRandom();
      // Brighter colors to match Whirlpool's visual density
      if (rt < 0.12) {
        if (rand < 0.6) {
          color.setHSL(0.12 + seededRandom() * 0.04, 0.35 + seededRandom() * 0.15, 0.85 + seededRandom() * 0.1);
        } else {
          color.setHSL(0.1 + seededRandom() * 0.05, 0.5 + seededRandom() * 0.2, 0.78 + seededRandom() * 0.12);
        }
      } else if (rt < 0.25) {
        if (rand < 0.4) {
          color.setHSL(0.11 + seededRandom() * 0.04, 0.45 + seededRandom() * 0.2, 0.72 + seededRandom() * 0.12);
        } else if (rand < 0.7) {
          color.setHSL(0.56 + seededRandom() * 0.1, 0.6 + seededRandom() * 0.25, 0.58 + seededRandom() * 0.15);
        } else if (rand < 0.85) {
          color.setHSL(0.92 + seededRandom() * 0.06, 0.85 + seededRandom() * 0.12, 0.6 + seededRandom() * 0.12);
        } else {
          color.setHSL(0.6 + seededRandom() * 0.05, 0.2 + seededRandom() * 0.1, 0.82 + seededRandom() * 0.1);
        }
      } else if (rt < 0.5) {
        if (rand < 0.35) {
          color.setHSL(0.93 + seededRandom() * 0.05, 0.88 + seededRandom() * 0.1, 0.58 + seededRandom() * 0.12);
        } else if (rand < 0.55) {
          color.setHSL(0.55 + seededRandom() * 0.12, 0.75 + seededRandom() * 0.2, 0.55 + seededRandom() * 0.15);
        } else if (rand < 0.72) {
          color.setHSL(0.98 + seededRandom() * 0.04, 0.8 + seededRandom() * 0.15, 0.52 + seededRandom() * 0.12);
        } else if (rand < 0.88) {
          color.setHSL(0.52 + seededRandom() * 0.08, 0.7 + seededRandom() * 0.2, 0.54 + seededRandom() * 0.12);
        } else {
          color.setHSL(0.58 + seededRandom() * 0.06, 0.35 + seededRandom() * 0.15, 0.74 + seededRandom() * 0.12);
        }
      } else if (rt < 0.75) {
        if (rand < 0.28) {
          color.setHSL(0.94 + seededRandom() * 0.04, 0.82 + seededRandom() * 0.15, 0.55 + seededRandom() * 0.12);
        } else if (rand < 0.55) {
          color.setHSL(0.56 + seededRandom() * 0.1, 0.7 + seededRandom() * 0.2, 0.52 + seededRandom() * 0.15);
        } else if (rand < 0.75) {
          color.setHSL(0.58 + seededRandom() * 0.08, 0.45 + seededRandom() * 0.2, 0.56 + seededRandom() * 0.12);
        } else if (rand < 0.9) {
          color.setHSL(0.5 + seededRandom() * 0.08, 0.65 + seededRandom() * 0.2, 0.54 + seededRandom() * 0.1);
        } else {
          color.setHSL(0.0 + seededRandom() * 0.03, 0.7 + seededRandom() * 0.2, 0.48 + seededRandom() * 0.1);
        }
      } else {
        if (rand < 0.6) {
          color.setHSL(0.57 + seededRandom() * 0.1, 0.5 + seededRandom() * 0.25, 0.5 + seededRandom() * 0.15);
        } else if (rand < 0.85) {
          color.setHSL(0.55 + seededRandom() * 0.12, 0.6 + seededRandom() * 0.2, 0.48 + seededRandom() * 0.12);
        } else {
          color.setHSL(0.95 + seededRandom() * 0.04, 0.65 + seededRandom() * 0.2, 0.5 + seededRandom() * 0.1);
        }
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs, GEOMETRY_VERSION]);

  const coreGeoFull = useMemo(() => {
    const coreCount = 180000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = ANDROMEDA.bulgeRadius * gs * 0.9;

    // Seeded random for consistent geometry
    let seed = 23456;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(seededRandom(), 1.2) * coreRadius;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = seededRandom();
      // Brighter core colors
      if (t < 0.4) {
        color.setHSL(0.12 + seededRandom() * 0.03, 0.3 + seededRandom() * 0.1, 0.9 + seededRandom() * 0.08);
      } else if (rand < 0.6) {
        color.setHSL(0.1 + seededRandom() * 0.04, 0.45 + seededRandom() * 0.15, 0.8 + seededRandom() * 0.1);
      } else if (rand < 0.85) {
        color.setHSL(0.08 + seededRandom() * 0.05, 0.55 + seededRandom() * 0.2, 0.7 + seededRandom() * 0.12);
      } else {
        color.setHSL(0.06 + seededRandom() * 0.04, 0.6 + seededRandom() * 0.15, 0.62 + seededRandom() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs, GEOMETRY_VERSION]);

  const haloGeoFull = useMemo(() => {
    const haloCount = 35000;
    const maxRadius = ANDROMEDA.diskRadius * gs * 0.5;
    const maxHeight = ANDROMEDA.diskRadius * gs * 0.15;
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();

    // Seeded random for consistent geometry
    let seed = 34567;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;
      const t = Math.pow(seededRandom(), 2);
      const innerRadius = maxRadius * 0.05;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = seededRandom() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const heightScale = 0.3 + rt * 0.7;
      const y = (seededRandom() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      const rand = seededRandom();
      // Brighter halo colors
      if (rand < 0.5) {
        color.setHSL(0.58 + seededRandom() * 0.1, 0.35 + seededRandom() * 0.2, 0.55 + seededRandom() * 0.15);
      } else if (rand < 0.8) {
        color.setHSL(0.12 + seededRandom() * 0.06, 0.3 + seededRandom() * 0.15, 0.58 + seededRandom() * 0.15);
      } else {
        color.setHSL(0.55 + seededRandom() * 0.08, 0.25 + seededRandom() * 0.15, 0.62 + seededRandom() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs, GEOMETRY_VERSION]);

  // Keep full star counts always (like Whirlpool's perceived behavior in the UI)
  const starsGeo = starsGeoFull;
  const coreGeo = coreGeoFull;
  const haloGeo = haloGeoFull;
  const sizeMultiplier = 1.0;

  useFrame(() => {
    frameCountRef.current++;

    if (!groupRef.current) return;

    groupRef.current.getWorldPosition(centerWorldPos.current);

    // Update LOD based on camera distance (used only for throttling; no visual reduction)
    lodControllerRef.current.update(camera.position, centerWorldPos.current, {
      galaxyDiameter: diskR * 2,
    });

    // Throttle position updates
    if (lodControllerRef.current.shouldUpdateThisFrame()) {
      const pos: [number, number, number] = [
        centerWorldPos.current.x,
        centerWorldPos.current.y,
        centerWorldPos.current.z,
      ];
      setObjectWorldPosition('andromeda', pos);
    }
  });

  return (
    <group ref={groupRef} position={andromedaPosition}>
      <group rotation={[ANDROMEDA.inclination, 0.3, 0]}>
        <DifferentialRotationPoints
          geometry={haloGeo}
          size={gs * 45 * sizeMultiplier}
          map={dotTexture}
          opacity={0.28}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.8}
          differentialStrength={0.08}
          renderOrder={1}
        />

        <DifferentialRotationPoints
          geometry={starsGeo}
          size={gs * 62 * sizeMultiplier}
          map={dotTexture}
          opacity={0.88}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={2}
        />

        <DifferentialRotationPoints
          geometry={coreGeo}
          size={gs * 95 * sizeMultiplier}
          map={dotTexture}
          opacity={0.95}
          maxRadius={ANDROMEDA.bulgeRadius * gs}
          rotationMultiplier={1.5}
          differentialStrength={0.1}
          renderOrder={3}
        />

        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.4, diskR * 2.4, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>
      </group>

      {/* Click target - reduced complexity */}
      <mesh
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[diskR * 1.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
