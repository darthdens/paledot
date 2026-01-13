import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getSombreroGlowTexture } from '../utils/sharedTextures';
import { LODController, getParticleSizeMultiplier, createLODGeometry, type LODLevel } from '../utils/lodManager';

interface SombreroGalaxyProps {
  visualScale: number;
}

const SOMBRERO = {
  diskRadius: 25000,
  bulgeRadius: 12000,
  dustLaneThickness: 600,
  inclination: (6 * Math.PI) / 180,
  distanceFromMilkyWay: 29.3e6,
};

export const SombreroGalaxy = ({ visualScale }: SombreroGalaxyProps) => {
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
  
  const sombreroPosition = useMemo<[number, number, number]>(() => [
    SOMBRERO.distanceFromMilkyWay * gs * 0.5,
    SOMBRERO.distanceFromMilkyWay * gs * -0.3,
    SOMBRERO.distanceFromMilkyWay * gs * 0.82,
  ], [gs]);

  const sombreroObject = useMemo(() => getObjectById('sombrero'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sombreroObject) setSelectedObject(sombreroObject);
  }, [sombreroObject, setSelectedObject]);

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getSombreroGlowTexture(), []);

  // Full resolution geometries - increased core density for brighter center
  const bulgeGeoFull = useMemo(() => {
    const count = 500000; // Increased for denser, brighter core
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxR = SOMBRERO.bulgeRadius * gs * 0.8;
    const maxHeightTop = SOMBRERO.bulgeRadius * gs * 0.22;
    const maxHeightBottom = SOMBRERO.bulgeRadius * gs * 0.12;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Higher exponent = more concentrated toward center
      const r = Math.pow(Math.random(), 2.8) * maxR;
      const theta = Math.random() * Math.PI * 2;
      const rt = r / maxR;

      positions[i3] = r * Math.cos(theta);
      positions[i3 + 2] = r * Math.sin(theta);
      
      let heightEnvelope: number;
      if (rt < 0.15) {
        heightEnvelope = 1.0;
      } else if (rt < 0.4) {
        const localT = (rt - 0.15) / 0.25;
        heightEnvelope = 1.0 - 0.12 * localT * localT;
      } else {
        const localT = (rt - 0.4) / 0.6;
        heightEnvelope = 0.88 * Math.pow(1 - localT, 1.3);
      }
      
      const yRand = Math.random();
      let yPos: number;
      if (yRand < 0.5) {
        yPos = Math.random() * maxHeightTop * heightEnvelope;
      } else {
        yPos = -Math.random() * maxHeightBottom * heightEnvelope;
      }
      positions[i3 + 1] = yPos;

      // Brighter colors especially near center
      if (rt < 0.08) {
        color.setHSL(0.12 + Math.random() * 0.02, 0.02, 1.0);
      } else if (rt < 0.2) {
        color.setHSL(0.11 + Math.random() * 0.02, 0.04, 0.98 + Math.random() * 0.02);
      } else if (rt < 0.45) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.08, 0.93 + Math.random() * 0.05);
      } else {
        color.setHSL(0.09 + Math.random() * 0.02, 0.14, 0.85 + Math.random() * 0.08);
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

  const diskGeoFull = useMemo(() => {
    const count = 250000; // Reduced from 400000
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.012;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const rand = Math.random();
      let radius: number;
      
      if (rand < 0.45) {
        const t = Math.pow(Math.random(), 1.8);
        radius = t * maxRadius * 0.3;
      } else if (rand < 0.55) {
        const t = Math.random();
        radius = maxRadius * 0.3 + t * maxRadius * 0.35;
      } else {
        const t = Math.pow(Math.random(), 0.5);
        radius = maxRadius * 0.65 + t * maxRadius * 0.35;
      }
      
      const rt = radius / maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() * 2 - 1) * diskThickness;
      positions[i3 + 2] = Math.sin(angle) * radius;

      if (rt < 0.25) {
        color.setHSL(0.1 + Math.random() * 0.02, 0.12, 0.85 + Math.random() * 0.1);
      } else if (rt < 0.55) {
        color.setHSL(0.09 + Math.random() * 0.03, 0.2, 0.72 + Math.random() * 0.1);
      } else {
        color.setHSL(0.08 + Math.random() * 0.03, 0.26, 0.65 + Math.random() * 0.1);
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

  const dustLaneGeoFull = useMemo(() => {
    const count = 50000; // Reduced from 80000
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const laneY = -maxRadius * 0.003;
    const laneThickness = maxRadius * 0.004;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const innerRadius = maxRadius * 0.1;
      const t = Math.pow(Math.random(), 0.5);
      const radius = innerRadius + t * (maxRadius * 0.95 - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = laneY + (Math.random() * 2 - 1) * laneThickness;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const randColor = Math.random();
      if (randColor < 0.6) {
        color.setHSL(0.04 + Math.random() * 0.02, 0.65, 0.06 + Math.random() * 0.03);
      } else {
        color.setHSL(0.03 + Math.random() * 0.02, 0.7, 0.1 + Math.random() * 0.04);
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

  const darkGasGeoFull = useMemo(() => {
    const count = 300000; // Reduced from 500000
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const cloudThickness = maxRadius * 0.06;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.pow(Math.random(), 0.4);
      const innerRadius = maxRadius * 0.55;
      const radius = innerRadius + t * (maxRadius * 1.08 - innerRadius);
      const rt = (radius - innerRadius) / (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      const heightSpread = cloudThickness * (0.4 + rt * 1.2);
      positions[i3 + 1] = (Math.random() * 2 - 1) * heightSpread;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const randColor = Math.random();
      if (randColor < 0.35) {
        color.setHSL(0.0 + Math.random() * 0.02, 0.6 + Math.random() * 0.2, 0.045 + Math.random() * 0.025);
      } else if (randColor < 0.55) {
        color.setHSL(0.6 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.035 + Math.random() * 0.025);
      } else if (randColor < 0.75) {
        color.setHSL(0.04 + Math.random() * 0.02, 0.5 + Math.random() * 0.15, 0.05 + Math.random() * 0.025);
      } else {
        color.setHSL(0.05 + Math.random() * 0.05, 0.2, 0.018 + Math.random() * 0.012);
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
  const bulgeGeoLow = useMemo(() => createLODGeometry(bulgeGeoFull, 'low'), [bulgeGeoFull]);
  const diskGeoLow = useMemo(() => createLODGeometry(diskGeoFull, 'low'), [diskGeoFull]);
  const dustLaneGeoLow = useMemo(() => createLODGeometry(dustLaneGeoFull, 'low'), [dustLaneGeoFull]);
  const darkGasGeoLow = useMemo(() => createLODGeometry(darkGasGeoFull, 'low'), [darkGasGeoFull]);

  // Select geometry based on LOD
  const bulgeGeo = lodLevel === 'high' || lodLevel === 'medium' ? bulgeGeoFull : bulgeGeoLow;
  const diskGeo = lodLevel === 'high' || lodLevel === 'medium' ? diskGeoFull : diskGeoLow;
  const dustLaneGeo = lodLevel === 'high' || lodLevel === 'medium' ? dustLaneGeoFull : dustLaneGeoLow;
  const darkGasGeo = lodLevel === 'high' || lodLevel === 'medium' ? darkGasGeoFull : darkGasGeoLow;
  const sizeMultiplier = getParticleSizeMultiplier(lodLevel);

  useFrame(() => {
    frameCountRef.current++;

    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);

      const diskR = SOMBRERO.diskRadius * gs;
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
        setObjectWorldPosition('sombrero', pos);
      }
    }
  });

  const diskR = SOMBRERO.diskRadius * gs;
  const bulgeR = SOMBRERO.bulgeRadius * gs;

  return (
    <group ref={groupRef} position={sombreroPosition}>
      <group rotation={[Math.PI / 2 - SOMBRERO.inclination, 0.3, 0]}>
        <DifferentialRotationPoints
          geometry={diskGeo}
          size={gs * 40 * sizeMultiplier}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        <DifferentialRotationPoints
          geometry={bulgeGeo}
          size={gs * 65 * sizeMultiplier}
          map={dotTexture}
          opacity={1.0}
          maxRadius={bulgeR}
          rotationMultiplier={1.1}
          renderOrder={3}
        />

        <DifferentialRotationPoints
          geometry={dustLaneGeo}
          size={gs * 35 * sizeMultiplier}
          map={dotTexture}
          opacity={0.92}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={4}
        />

        <DifferentialRotationPoints
          geometry={darkGasGeo}
          size={gs * 45 * sizeMultiplier}
          map={dotTexture}
          opacity={0.88}
          maxRadius={diskR * 1.1}
          rotationMultiplier={0.85}
          renderOrder={5}
        />
      </group>

      <sprite renderOrder={1} frustumCulled={false} scale={[diskR * 2.5, diskR * 2.5, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </sprite>

      <sprite renderOrder={0} frustumCulled={false} scale={[diskR * 2.9, diskR * 2.9, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </sprite>

      <sprite renderOrder={-1} frustumCulled={false} scale={[diskR * 3.4, diskR * 3.4, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </sprite>

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
