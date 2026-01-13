import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getTriangulumGlowTexture } from '../utils/sharedTextures';
import { LODController, getParticleSizeMultiplier, createLODGeometry, type LODLevel } from '../utils/lodManager';

interface TriangulumGalaxyProps {
  visualScale: number;
}

const TRIANGULUM = {
  diskRadius: 30000,
  bulgeRadius: 4000,
  branches: 4,
  spinTurns: 1.2,
  inclination: (55 * Math.PI) / 180,
  distanceFromMilkyWay: 2.73e6,
};

export const TriangulumGalaxy = ({ visualScale }: TriangulumGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const frameCountRef = useRef(0);
  const lodControllerRef = useRef(new LODController('high'));
  const currentLODRef = useRef<LODLevel>('high');

  const { camera } = useThree();
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  const triangulumPosition = useMemo<[number, number, number]>(() => [
    -TRIANGULUM.distanceFromMilkyWay * gs * 0.5,
    TRIANGULUM.distanceFromMilkyWay * gs * 0.1,
    TRIANGULUM.distanceFromMilkyWay * gs * 0.85,
  ], [gs]);

  const triangulumObject = useMemo(() => getObjectById('triangulum'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (triangulumObject) setSelectedObject(triangulumObject);
  }, [triangulumObject, setSelectedObject]);

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getTriangulumGlowTexture(), []);

  // Full resolution geometries
  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = TRIANGULUM;
    const maxRadius = TRIANGULUM.diskRadius * gs;
    const starCount = 300000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 4.0;
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

      const armWidth = 0.1 + rt * 0.2;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;
      const isInterArm = Math.random() < 0.45;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (1.0 + rt * 0.8) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.04 + rt * 0.08) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.015 + rt * 0.04;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = Math.random();
      if (rt < 0.15) {
        if (rand < 0.7) {
          color.setHSL(0.6 + Math.random() * 0.05, 0.3 + Math.random() * 0.2, 0.85 + Math.random() * 0.1);
        } else {
          color.setHSL(0.58 + Math.random() * 0.08, 0.5 + Math.random() * 0.2, 0.7 + Math.random() * 0.15);
        }
      } else if (rt < 0.35) {
        if (rand < 0.6) {
          color.setHSL(0.58 + Math.random() * 0.08, 0.7 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
        } else if (rand < 0.85) {
          color.setHSL(0.52 + Math.random() * 0.06, 0.8 + Math.random() * 0.15, 0.5 + Math.random() * 0.12);
        } else {
          color.setHSL(0.92 + Math.random() * 0.06, 0.8 + Math.random() * 0.15, 0.6 + Math.random() * 0.1);
        }
      } else if (rt < 0.6) {
        if (rand < 0.3) {
          color.setHSL(0.58 + Math.random() * 0.08, 0.75 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
        } else if (rand < 0.5) {
          color.setHSL(0.9 + Math.random() * 0.08, 0.85 + Math.random() * 0.1, 0.55 + Math.random() * 0.12);
        } else if (rand < 0.65) {
          color.setHSL(0.5 + Math.random() * 0.06, 0.8 + Math.random() * 0.15, 0.5 + Math.random() * 0.1);
        } else if (rand < 0.85) {
          color.setHSL(0.12 + Math.random() * 0.06, 0.85 + Math.random() * 0.1, 0.55 + Math.random() * 0.12);
        } else {
          color.setHSL(0.08 + Math.random() * 0.04, 0.9 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
        }
      } else {
        if (rand < 0.35) {
          color.setHSL(0.58 + Math.random() * 0.1, 0.7 + Math.random() * 0.25, 0.45 + Math.random() * 0.15);
        } else if (rand < 0.55) {
          color.setHSL(0.92 + Math.random() * 0.06, 0.75 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
        } else if (rand < 0.75) {
          color.setHSL(0.13 + Math.random() * 0.05, 0.8 + Math.random() * 0.15, 0.55 + Math.random() * 0.12);
        } else if (rand < 0.9) {
          color.setHSL(0.1 + Math.random() * 0.04, 0.9 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
        } else {
          color.setHSL(0.45 + Math.random() * 0.1, 0.6 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
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
    const coreCount = 120000; // Increased for denser core
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = TRIANGULUM.bulgeRadius * gs;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      // Lower exponent = more concentrated toward center
      const r = Math.pow(Math.random(), 2.0) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.4;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      // Brighter colors for core stars
      if (t < 0.5) {
        color.setHSL(0.6 + Math.random() * 0.05, 0.2 + Math.random() * 0.1, 0.92 + Math.random() * 0.08);
      } else if (rand < 0.7) {
        color.setHSL(0.58 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.85 + Math.random() * 0.1);
      } else {
        color.setHSL(0.56 + Math.random() * 0.08, 0.5 + Math.random() * 0.15, 0.75 + Math.random() * 0.12);
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
    const haloCount = 30000;
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();
    const haloRadius = TRIANGULUM.diskRadius * gs * 1.3;

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;
      const r = (0.4 + Math.pow(Math.random(), 0.6) * 0.6) * haloRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      if (rand < 0.6) {
        color.setHSL(0.6 + Math.random() * 0.08, 0.3 + Math.random() * 0.2, 0.5 + Math.random() * 0.2);
      } else {
        color.setHSL(0.55 + Math.random() * 0.1, 0.2 + Math.random() * 0.15, 0.6 + Math.random() * 0.15);
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

  // Select geometry based on LOD
  const starsGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? starsGeoFull : starsGeoLow;
  const coreGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? coreGeoFull : coreGeoLow;
  const haloGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? haloGeoFull : haloGeoLow;
  const sizeMultiplier = getParticleSizeMultiplier(currentLODRef.current);

  useFrame(() => {
    frameCountRef.current++;
    
    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);
      
      const diskR = TRIANGULUM.diskRadius * gs;
      const { level } = lodControllerRef.current.update(
        camera.position,
        centerWorldPos.current,
        { galaxyDiameter: diskR * 2 }
      );
      currentLODRef.current = level;

      // Throttle position updates
      if (lodControllerRef.current.shouldUpdateThisFrame()) {
        const pos: [number, number, number] = [
          centerWorldPos.current.x,
          centerWorldPos.current.y,
          centerWorldPos.current.z,
        ];
        setObjectWorldPosition('triangulum', pos);
      }
    }
  });

  const diskR = TRIANGULUM.diskRadius * gs;

  return (
    <group ref={groupRef} position={triangulumPosition}>
      <group rotation={[TRIANGULUM.inclination, -0.2, 0]}>
        <DifferentialRotationPoints
          key="triangulum-halo"
          geometry={haloGeo}
          size={gs * 35 * sizeMultiplier}
          map={dotTexture}
          opacity={0.25}
          maxRadius={diskR * 1.3}
          rotationMultiplier={0.7}
          renderOrder={1}
        />

        <DifferentialRotationPoints
          key="triangulum-arms"
          geometry={starsGeo}
          size={gs * 50 * sizeMultiplier}
          map={dotTexture}
          opacity={0.85}
          maxRadius={diskR}
          rotationMultiplier={1}
          renderOrder={2}
        />

        <DifferentialRotationPoints
          key="triangulum-core"
          geometry={coreGeo}
          size={gs * 90 * sizeMultiplier}
          map={dotTexture}
          opacity={1.0}
          maxRadius={TRIANGULUM.bulgeRadius * gs}
          rotationMultiplier={1.5}
          renderOrder={3}
        />

        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.20}
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
