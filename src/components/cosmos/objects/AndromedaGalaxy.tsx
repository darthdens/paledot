import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getAndromedaGlowTexture } from '../utils/sharedTextures';
import { LODController, getParticleSizeMultiplier, createLODGeometry, type LODLevel } from '../utils/lodManager';
import { useGeometryReady } from '../hooks/useGeometryReady';

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
  const [lodLevel, setLodLevel] = useState<LODLevel>('high');
  const lodLevelRef = useRef<LODLevel>('high');

  const { camera } = useThree();
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  const andromedaPosition = useMemo<[number, number, number]>(() => [
    ANDROMEDA.distanceFromMilkyWay * gs * 0.7,
    ANDROMEDA.distanceFromMilkyWay * gs * 0.15,
    ANDROMEDA.distanceFromMilkyWay * gs * 0.7,
  ], [gs]);

  const andromedaObject = useMemo(() => getObjectById('andromeda'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (andromedaObject) setSelectedObject(andromedaObject);
  }, [andromedaObject, setSelectedObject]);

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getAndromedaGlowTexture(), []);

  // Full resolution geometries
  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = ANDROMEDA;
    const maxRadius = ANDROMEDA.diskRadius * gs;
    const starCount = 450000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 4.5;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;

      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      const spinAngle = rt * spinTurns * Math.PI * 2;

      const armWidth = 0.12 + rt * 0.20;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;
      const isInterArm = Math.random() < 0.45;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (1.0 + rt * 0.7) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.06 + rt * 0.12) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.015 + rt * 0.025;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = Math.random();
      if (rt < 0.12) {
        if (rand < 0.6) {
          color.setHSL(0.6 + Math.random() * 0.05, 0.15 + Math.random() * 0.1, 0.85 + Math.random() * 0.1);
        } else {
          color.setHSL(0.58 + Math.random() * 0.06, 0.6 + Math.random() * 0.2, 0.75 + Math.random() * 0.12);
        }
      } else if (rt < 0.25) {
        if (rand < 0.7) {
          color.setHSL(0.58 + Math.random() * 0.08, 0.75 + Math.random() * 0.2, 0.58 + Math.random() * 0.12);
        } else {
          color.setHSL(0.6 + Math.random() * 0.04, 0.4 + Math.random() * 0.15, 0.75 + Math.random() * 0.1);
        }
      } else if (rt < 0.45) {
        if (rand < 0.45) {
          color.setHSL(0.08 + Math.random() * 0.06, 0.9 + Math.random() * 0.1, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.85) {
          color.setHSL(0.56 + Math.random() * 0.1, 0.85 + Math.random() * 0.15, 0.55 + Math.random() * 0.12);
        } else {
          color.setHSL(0.52 + Math.random() * 0.06, 0.9 + Math.random() * 0.1, 0.6 + Math.random() * 0.1);
        }
      } else if (rt < 0.7) {
        if (rand < 0.8) {
          color.setHSL(0.55 + Math.random() * 0.12, 0.9 + Math.random() * 0.1, 0.55 + Math.random() * 0.15);
        } else if (rand < 0.92) {
          color.setHSL(0.5 + Math.random() * 0.08, 0.95, 0.6 + Math.random() * 0.1);
        } else {
          color.setHSL(0.06 + Math.random() * 0.05, 0.85 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
        }
      } else {
        if (rand < 0.85) {
          color.setHSL(0.55 + Math.random() * 0.1, 0.92 + Math.random() * 0.08, 0.5 + Math.random() * 0.15);
        } else {
          color.setHSL(0.5 + Math.random() * 0.06, 0.95, 0.58 + Math.random() * 0.12);
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
  }, [gs]);

  const coreGeoFull = useMemo(() => {
    const coreCount = 180000; // Increased for denser, brighter core
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = ANDROMEDA.bulgeRadius * gs * 0.9;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      // Higher exponent = more concentrated toward center
      const r = Math.pow(Math.random(), 2.0) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      // Brighter colors for core stars
      if (t < 0.3) {
        color.setHSL(0.6 + Math.random() * 0.05, 0.08 + Math.random() * 0.06, 0.95 + Math.random() * 0.05);
      } else if (rand < 0.5) {
        color.setHSL(0.58 + Math.random() * 0.06, 0.2 + Math.random() * 0.1, 0.88 + Math.random() * 0.08);
      } else if (rand < 0.8) {
        color.setHSL(0.58 + Math.random() * 0.08, 0.35 + Math.random() * 0.15, 0.78 + Math.random() * 0.12);
      } else {
        color.setHSL(0.08 + Math.random() * 0.04, 0.35 + Math.random() * 0.15, 0.72 + Math.random() * 0.12);
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
  }, [gs]);

  const haloGeoFull = useMemo(() => {
    const count = 15000;
    const maxRadius = ANDROMEDA.diskRadius * gs * 0.5;
    const maxHeight = ANDROMEDA.diskRadius * gs * 0.15;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.pow(Math.random(), 2);
      const innerRadius = maxRadius * 0.05;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const heightScale = 0.3 + rt * 0.7;
      const y = (Math.random() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      const rand = Math.random();
      if (rand < 0.5) {
        color.setHSL(0.12 + Math.random() * 0.06, 0.3 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        color.setHSL(0.08 + Math.random() * 0.05, 0.5 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.6 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
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
  }, [gs]);

  // Create LOD geometries
  const starsGeoLow = useMemo(() => createLODGeometry(starsGeoFull, 'low'), [starsGeoFull]);
  const coreGeoLow = useMemo(() => createLODGeometry(coreGeoFull, 'low'), [coreGeoFull]);
  const haloGeoLow = useMemo(() => createLODGeometry(haloGeoFull, 'low'), [haloGeoFull]);

  // Signal geometry ready for loading screen
  useGeometryReady('andromeda', !!starsGeoFull && !!coreGeoFull);

  // Select geometry based on LOD
  const starsGeo = lodLevel === 'high' || lodLevel === 'medium' ? starsGeoFull : starsGeoLow;
  const coreGeo = lodLevel === 'high' || lodLevel === 'medium' ? coreGeoFull : coreGeoLow;
  const haloGeo = lodLevel === 'high' || lodLevel === 'medium' ? haloGeoFull : haloGeoLow;
  const sizeMultiplier = getParticleSizeMultiplier(lodLevel);

  useFrame(() => {
    frameCountRef.current++;

    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);

      const diskR = ANDROMEDA.diskRadius * gs;
      const { level } = lodControllerRef.current.update(
        camera.position,
        centerWorldPos.current,
        { galaxyDiameter: diskR * 2 }
      );

      if (level !== lodLevelRef.current) {
        lodLevelRef.current = level;
        setLodLevel(level);
      }

      // Throttle position updates
      if (lodControllerRef.current.shouldUpdateThisFrame()) {
        const pos: [number, number, number] = [
          centerWorldPos.current.x,
          centerWorldPos.current.y,
          centerWorldPos.current.z,
        ];
        setObjectWorldPosition('andromeda', pos);
      }
    }
  });

  const diskR = ANDROMEDA.diskRadius * gs;

  return (
    <group ref={groupRef} position={andromedaPosition}>
      <group rotation={[ANDROMEDA.inclination, 0.3, 0]}>
        <DifferentialRotationPoints
          geometry={haloGeo}
          size={gs * 40 * sizeMultiplier}
          map={dotTexture}
          opacity={0.3}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.8}
          renderOrder={1}
        />

        <DifferentialRotationPoints
          geometry={starsGeo}
          size={gs * 55 * sizeMultiplier}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        <DifferentialRotationPoints
          geometry={coreGeo}
          size={gs * 105 * sizeMultiplier}
          map={dotTexture}
          opacity={1.0}
          maxRadius={ANDROMEDA.bulgeRadius * gs}
          rotationMultiplier={1.5}
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
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[diskR * 1.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
