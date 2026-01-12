import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getTriangulumGlowTexture } from '../utils/sharedTextures';
import { LODController } from '../utils/lodManager';

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

  const { camera } = useThree();
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  const diskR = TRIANGULUM.diskRadius * gs;

  const triangulumPosition = useMemo<[number, number, number]>(
    () => [
      -TRIANGULUM.distanceFromMilkyWay * gs * 0.5,
      TRIANGULUM.distanceFromMilkyWay * gs * 0.1,
      TRIANGULUM.distanceFromMilkyWay * gs * 0.85,
    ],
    [gs]
  );

  const triangulumObject = useMemo(() => getObjectById('triangulum'), []);

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (triangulumObject) setSelectedObject(triangulumObject);
    },
    [triangulumObject, setSelectedObject]
  );

  // Use shared textures
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getTriangulumGlowTexture(), []);

  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = TRIANGULUM;
    const maxRadius = TRIANGULUM.diskRadius * gs;
    const starCount = 500000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    // Seeded random for consistent geometry
    let seed = 54321;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    const k = 4.0;
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

      const armWidth = 0.1 + rt * 0.2;
      const armJitter = (seededRandom() + seededRandom() + seededRandom() - 1.5) * armWidth;
      const isInterArm = seededRandom() < 0.45;
      const interArmJitter = isInterArm ? (seededRandom() - 0.5) * (1.0 + rt * 0.8) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.04 + rt * 0.08) * maxRadius;
      const radialJitter = (seededRandom() + seededRandom() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.015 + rt * 0.04;
      const yJitter =
        (seededRandom() + seededRandom() + seededRandom() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = seededRandom();
      if (rt < 0.15) {
        if (rand < 0.7) {
          color.setHSL(0.6 + seededRandom() * 0.05, 0.3 + seededRandom() * 0.2, 0.85 + seededRandom() * 0.1);
        } else {
          color.setHSL(0.58 + seededRandom() * 0.08, 0.5 + seededRandom() * 0.2, 0.7 + seededRandom() * 0.15);
        }
      } else if (rt < 0.35) {
        if (rand < 0.6) {
          color.setHSL(0.58 + seededRandom() * 0.08, 0.7 + seededRandom() * 0.2, 0.55 + seededRandom() * 0.15);
        } else if (rand < 0.85) {
          color.setHSL(0.52 + seededRandom() * 0.06, 0.8 + seededRandom() * 0.15, 0.5 + seededRandom() * 0.12);
        } else {
          color.setHSL(0.92 + seededRandom() * 0.06, 0.8 + seededRandom() * 0.15, 0.6 + seededRandom() * 0.1);
        }
      } else if (rt < 0.6) {
        if (rand < 0.3) {
          color.setHSL(0.58 + seededRandom() * 0.08, 0.75 + seededRandom() * 0.2, 0.5 + seededRandom() * 0.15);
        } else if (rand < 0.5) {
          color.setHSL(0.9 + seededRandom() * 0.08, 0.85 + seededRandom() * 0.1, 0.55 + seededRandom() * 0.12);
        } else if (rand < 0.65) {
          color.setHSL(0.5 + seededRandom() * 0.06, 0.8 + seededRandom() * 0.15, 0.5 + seededRandom() * 0.1);
        } else if (rand < 0.85) {
          color.setHSL(0.12 + seededRandom() * 0.06, 0.85 + seededRandom() * 0.1, 0.55 + seededRandom() * 0.12);
        } else {
          color.setHSL(0.08 + seededRandom() * 0.04, 0.9 + seededRandom() * 0.1, 0.5 + seededRandom() * 0.1);
        }
      } else {
        if (rand < 0.35) {
          color.setHSL(0.58 + seededRandom() * 0.1, 0.7 + seededRandom() * 0.25, 0.45 + seededRandom() * 0.15);
        } else if (rand < 0.55) {
          color.setHSL(0.92 + seededRandom() * 0.06, 0.75 + seededRandom() * 0.2, 0.5 + seededRandom() * 0.15);
        } else if (rand < 0.75) {
          color.setHSL(0.13 + seededRandom() * 0.05, 0.8 + seededRandom() * 0.15, 0.55 + seededRandom() * 0.12);
        } else if (rand < 0.9) {
          color.setHSL(0.1 + seededRandom() * 0.04, 0.9 + seededRandom() * 0.1, 0.5 + seededRandom() * 0.1);
        } else {
          color.setHSL(0.45 + seededRandom() * 0.1, 0.6 + seededRandom() * 0.2, 0.45 + seededRandom() * 0.1);
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
    const coreCount = 120000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = TRIANGULUM.bulgeRadius * gs;

    // Seeded random for consistent geometry
    let seed = 65432;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(seededRandom(), 1.3) * coreRadius;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.4;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = seededRandom();
      if (t < 0.5) {
        color.setHSL(0.6 + seededRandom() * 0.05, 0.25 + seededRandom() * 0.15, 0.88 + seededRandom() * 0.08);
      } else if (rand < 0.7) {
        color.setHSL(0.58 + seededRandom() * 0.06, 0.4 + seededRandom() * 0.2, 0.75 + seededRandom() * 0.12);
      } else {
        color.setHSL(0.56 + seededRandom() * 0.08, 0.6 + seededRandom() * 0.2, 0.6 + seededRandom() * 0.15);
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
    const haloCount = 60000;
    const positions = new Float32Array(haloCount * 3);
    const colors = new Float32Array(haloCount * 3);
    const color = new THREE.Color();
    const haloRadius = TRIANGULUM.diskRadius * gs * 1.3;

    // Seeded random for consistent geometry
    let seed = 76543;
    const seededRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < haloCount; i++) {
      const i3 = i * 3;
      const r = (0.4 + Math.pow(seededRandom(), 0.6) * 0.6) * haloRadius;
      const theta = seededRandom() * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = seededRandom();
      if (rand < 0.6) {
        color.setHSL(0.6 + seededRandom() * 0.08, 0.3 + seededRandom() * 0.2, 0.5 + seededRandom() * 0.2);
      } else {
        color.setHSL(0.55 + seededRandom() * 0.1, 0.2 + seededRandom() * 0.15, 0.6 + seededRandom() * 0.15);
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
      setObjectWorldPosition('triangulum', pos);
    }
  });

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
          size={gs * 75 * sizeMultiplier}
          map={dotTexture}
          opacity={0.95}
          maxRadius={TRIANGULUM.bulgeRadius * gs}
          rotationMultiplier={1.5}
          renderOrder={3}
        />

        <sprite renderOrder={4} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.2}
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
