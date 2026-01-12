import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getWhirlpoolGlowTexture, getCompanionGlowTexture } from '../utils/sharedTextures';
import { LODController, getParticleSizeMultiplier, createLODGeometry, type LODLevel } from '../utils/lodManager';

interface WhirlpoolGalaxyProps {
  visualScale: number;
}

const WHIRLPOOL = {
  diskRadius: 38000,
  bulgeRadius: 5000,
  branches: 2,
  spinTurns: 2.35,
  inclination: (20 * Math.PI) / 180,
  distanceFromMilkyWay: 23e6,
};

const NGC5195 = {
  radius: 12000,
  distanceFromCenter: 40000,
  yOffset: 2000,
};

export const WhirlpoolGalaxy = ({ visualScale }: WhirlpoolGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const companionGroupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const rotationTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lodControllerRef = useRef(new LODController('high'));
  const currentLODRef = useRef<LODLevel>('high');

  const { camera } = useThree();
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  const timeSpeed = useCosmosStore((s) => s.timeSpeed);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  const whirlpoolPosition = useMemo<[number, number, number]>(() => [
    WHIRLPOOL.distanceFromMilkyWay * gs * 0.85,
    WHIRLPOOL.distanceFromMilkyWay * gs * 0.25,
    -WHIRLPOOL.distanceFromMilkyWay * gs * 0.45,
  ], [gs]);

  const whirlpoolObject = useMemo(() => getObjectById('whirlpool'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (whirlpoolObject) setSelectedObject(whirlpoolObject);
  }, [whirlpoolObject, setSelectedObject]);

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getWhirlpoolGlowTexture(), []);
  const companionGlowTexture = useMemo(() => getCompanionGlowTexture(), []);

  const getArmTipAngle = useCallback((time: number) => {
    const rt = 1.0;
    const logSpiral = Math.pow(rt, 0.5);
    const spinAngle = logSpiral * WHIRLPOOL.spinTurns * Math.PI * 2;
    const branchAngle = 0;
    const omega = 1.0;
    const rotationAngle = time * omega;
    return branchAngle + spinAngle + rotationAngle;
  }, []);

  // Full resolution geometries - reduced particle counts
  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const starCount = 600000; // Restored to full count

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 5.0;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;
      
      const innerRadius = maxRadius * 0.015;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      const spiralFactor = Math.pow(rt, 0.5);
      const spinAngle = spiralFactor * spinTurns * Math.PI * 2;

      const armWidth = 0.18 + rt * 0.25;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;
      const isInterArm = Math.random() < 0.72;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.65 + rt * 0.6) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.06 + rt * 0.1) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.012 + rt * 0.03;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = Math.random();
      const nearArmCenter = Math.abs(armJitter) < armWidth * 0.4;

      if (rt < 0.12) {
        if (rand < 0.7) {
          color.setHSL(0.12 + Math.random() * 0.04, 0.35 + Math.random() * 0.15, 0.85 + Math.random() * 0.1);
        } else {
          color.setHSL(0.1 + Math.random() * 0.05, 0.5 + Math.random() * 0.2, 0.75 + Math.random() * 0.12);
        }
      } else if (rt < 0.25) {
        if (rand < 0.4) {
          color.setHSL(0.11 + Math.random() * 0.04, 0.45 + Math.random() * 0.2, 0.7 + Math.random() * 0.12);
        } else if (rand < 0.7) {
          color.setHSL(0.56 + Math.random() * 0.1, 0.6 + Math.random() * 0.25, 0.55 + Math.random() * 0.15);
        } else if (nearArmCenter && rand < 0.85) {
          color.setHSL(0.92 + Math.random() * 0.06, 0.85 + Math.random() * 0.12, 0.58 + Math.random() * 0.12);
        } else {
          color.setHSL(0.6 + Math.random() * 0.05, 0.2 + Math.random() * 0.1, 0.8 + Math.random() * 0.1);
        }
      } else if (rt < 0.5) {
        if (nearArmCenter && rand < 0.35) {
          color.setHSL(0.93 + Math.random() * 0.05, 0.88 + Math.random() * 0.1, 0.55 + Math.random() * 0.12);
        } else if (rand < 0.55) {
          color.setHSL(0.55 + Math.random() * 0.12, 0.75 + Math.random() * 0.2, 0.52 + Math.random() * 0.15);
        } else if (rand < 0.72) {
          color.setHSL(0.98 + Math.random() * 0.04, 0.8 + Math.random() * 0.15, 0.48 + Math.random() * 0.12);
        } else if (rand < 0.88) {
          color.setHSL(0.52 + Math.random() * 0.08, 0.7 + Math.random() * 0.2, 0.5 + Math.random() * 0.12);
        } else {
          color.setHSL(0.58 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.72 + Math.random() * 0.12);
        }
      } else if (rt < 0.75) {
        if (nearArmCenter && rand < 0.28) {
          color.setHSL(0.94 + Math.random() * 0.04, 0.82 + Math.random() * 0.15, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.55) {
          color.setHSL(0.56 + Math.random() * 0.1, 0.7 + Math.random() * 0.2, 0.48 + Math.random() * 0.15);
        } else if (rand < 0.75) {
          color.setHSL(0.58 + Math.random() * 0.08, 0.45 + Math.random() * 0.2, 0.52 + Math.random() * 0.12);
        } else if (rand < 0.9) {
          color.setHSL(0.5 + Math.random() * 0.08, 0.65 + Math.random() * 0.2, 0.5 + Math.random() * 0.1);
        } else {
          color.setHSL(0.0 + Math.random() * 0.03, 0.7 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
        }
      } else {
        if (rand < 0.6) {
          color.setHSL(0.57 + Math.random() * 0.1, 0.5 + Math.random() * 0.25, 0.45 + Math.random() * 0.15);
        } else if (rand < 0.85) {
          color.setHSL(0.55 + Math.random() * 0.12, 0.6 + Math.random() * 0.2, 0.42 + Math.random() * 0.12);
        } else {
          color.setHSL(0.95 + Math.random() * 0.04, 0.65 + Math.random() * 0.2, 0.45 + Math.random() * 0.1);
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
    const coreCount = 200000; // Doubled for denser core
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = WHIRLPOOL.bulgeRadius * gs;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.4) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.45;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      if (t < 0.4) {
        color.setHSL(0.12 + Math.random() * 0.03, 0.3 + Math.random() * 0.1, 0.9 + Math.random() * 0.08);
      } else if (rand < 0.6) {
        color.setHSL(0.1 + Math.random() * 0.04, 0.45 + Math.random() * 0.15, 0.78 + Math.random() * 0.1);
      } else if (rand < 0.85) {
        color.setHSL(0.08 + Math.random() * 0.05, 0.55 + Math.random() * 0.2, 0.68 + Math.random() * 0.12);
      } else {
        color.setHSL(0.06 + Math.random() * 0.04, 0.6 + Math.random() * 0.15, 0.6 + Math.random() * 0.12);
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
    const haloCount = 40000; // Increased for density
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();
    const haloRadius = WHIRLPOOL.diskRadius * gs * 1.2;

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;
      const r = (0.35 + Math.pow(Math.random(), 0.7) * 0.65) * haloRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.5;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      if (rand < 0.5) {
        color.setHSL(0.58 + Math.random() * 0.1, 0.35 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        color.setHSL(0.12 + Math.random() * 0.06, 0.3 + Math.random() * 0.15, 0.55 + Math.random() * 0.15);
      } else {
        color.setHSL(0.55 + Math.random() * 0.08, 0.25 + Math.random() * 0.15, 0.6 + Math.random() * 0.12);
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

  const dustLanesGeoFull = useMemo(() => {
    const { branches, spinTurns } = WHIRLPOOL;
    const maxRadius = WHIRLPOOL.diskRadius * gs;
    const dustCount = 150000; // Increased for detail

    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      const t = 0.15 + Math.pow(Math.random(), 0.9) * 0.6;
      const radius = t * maxRadius;
      const rt = radius / maxRadius;

      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;
      const spiralFactor = Math.pow(rt, 0.5);
      const spinAngle = spiralFactor * spinTurns * Math.PI * 2;

      const trailingOffset = (Math.random() - 0.5) * 0.12;
      const laneWidth = 0.08 + rt * 0.12;
      const laneJitter = (Math.random() + Math.random() + Math.random() - 1.5) * laneWidth;
      const angle = branchAngle + spinAngle + trailingOffset + laneJitter;

      positions[i3] = Math.cos(angle) * radius;
      const thickness = 0.012;
      const yJitter = (Math.random() - 0.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const dustVariation = Math.random();
      if (dustVariation < 0.4) {
        color.setHSL(0.03 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.06 + Math.random() * 0.04);
      } else if (dustVariation < 0.7) {
        color.setHSL(0.05 + Math.random() * 0.03, 0.4 + Math.random() * 0.2, 0.08 + Math.random() * 0.04);
      } else {
        color.setHSL(0.04 + Math.random() * 0.02, 0.35 + Math.random() * 0.15, 0.05 + Math.random() * 0.03);
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

  const companionGeo = useMemo(() => {
    const count = 60000; // Increased for density
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const compRadius = NGC5195.radius * gs;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.1) * compRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / compRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta) * 1.2;
      positions[i3 + 1] = r * Math.cos(phi) * 0.7;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      if (t < 0.3) {
        color.setHSL(0.11 + Math.random() * 0.03, 0.4 + Math.random() * 0.15, 0.82 + Math.random() * 0.1);
      } else if (rand < 0.5) {
        color.setHSL(0.1 + Math.random() * 0.05, 0.55 + Math.random() * 0.2, 0.65 + Math.random() * 0.15);
      } else if (rand < 0.8) {
        color.setHSL(0.07 + Math.random() * 0.04, 0.6 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else {
        color.setHSL(0.05 + Math.random() * 0.04, 0.5 + Math.random() * 0.2, 0.6 + Math.random() * 0.12);
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
  const dustLanesGeoLow = useMemo(() => createLODGeometry(dustLanesGeoFull, 'low'), [dustLanesGeoFull]);

  // Select geometry based on LOD
  const starsGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? starsGeoFull : starsGeoLow;
  const coreGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? coreGeoFull : coreGeoLow;
  const haloGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? haloGeoFull : haloGeoLow;
  const dustLanesGeo = currentLODRef.current === 'high' || currentLODRef.current === 'medium' ? dustLanesGeoFull : dustLanesGeoLow;
  const sizeMultiplier = getParticleSizeMultiplier(currentLODRef.current);

  useFrame((_, delta) => {
    frameCountRef.current++;
    
    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);
      
      const diskR = WHIRLPOOL.diskRadius * gs;
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
        setObjectWorldPosition('whirlpool', pos);
      }
    }

    if (!isInStarSystem) {
      rotationTimeRef.current += delta * 0.00625 * timeSpeed;
    }

    const armAngle = getArmTipAngle(rotationTimeRef.current);
    const companionDist = NGC5195.distanceFromCenter * gs;
    
    if (companionGroupRef.current) {
      companionGroupRef.current.position.x = Math.cos(armAngle) * companionDist;
      companionGroupRef.current.position.y = NGC5195.yOffset * gs;
      companionGroupRef.current.position.z = Math.sin(armAngle) * companionDist;
    }
  });

  const diskR = WHIRLPOOL.diskRadius * gs;
  const compR = NGC5195.radius * gs;

  return (
    <group ref={groupRef} position={whirlpoolPosition}>
      <group rotation={[WHIRLPOOL.inclination, 0.1, 0]}>
        <DifferentialRotationPoints
          key="whirlpool-halo"
          geometry={haloGeo}
          size={gs * 35 * sizeMultiplier}
          map={dotTexture}
          opacity={0.28}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.7}
          differentialStrength={0.08}
          renderOrder={1}
        />

        <DifferentialRotationPoints
          key="whirlpool-arms"
          geometry={starsGeo}
          size={gs * 52 * sizeMultiplier}
          map={dotTexture}
          opacity={0.88}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={2}
        />

        <DifferentialRotationPoints
          key="whirlpool-dust"
          geometry={dustLanesGeo}
          size={gs * 140 * sizeMultiplier}
          map={dotTexture}
          opacity={0.55}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.06}
          renderOrder={0}
        />

        <DifferentialRotationPoints
          key="whirlpool-core"
          geometry={coreGeo}
          size={gs * 80 * sizeMultiplier}
          map={dotTexture}
          opacity={0.95}
          maxRadius={WHIRLPOOL.bulgeRadius * gs}
          rotationMultiplier={1.4}
          differentialStrength={0.1}
          renderOrder={3}
        />

        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.0, diskR * 2.0, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>

        <group ref={companionGroupRef}>
          <points frustumCulled={false} renderOrder={2}>
            <bufferGeometry attach="geometry" {...companionGeo} />
            <pointsMaterial
              size={gs * 45 * sizeMultiplier}
              map={dotTexture}
              vertexColors
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              sizeAttenuation
            />
          </points>

          <sprite renderOrder={3} frustumCulled={false} scale={[compR * 2.5, compR * 2.5, 1]}>
            <spriteMaterial
              map={companionGlowTexture}
              transparent
              opacity={0.75}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </sprite>
        </group>
      </group>

      {/* Click target - reduced complexity */}
      <mesh 
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[diskR * 1.3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
