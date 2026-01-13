import { useRef, useMemo, useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { getObjectById } from '../data/celestialObjects';
import { DifferentialRotationPoints } from './DifferentialRotationMaterial';
import { getDotTexture, getMilkyWayGlowTexture } from '../utils/sharedTextures';
import { LODController, getParticleSizeMultiplier, createLODGeometry, type LODLevel } from '../utils/lodManager';

interface MilkyWayGalaxyProps {
  visualScale: number;
  showYouAreHere?: boolean;
}

// Milky Way parameters
const MILKY_WAY = {
  diskRadius: 52500,
  bulgeRadius: 10000,
  sunDistance: 26000,
  sunAngle: Math.PI * 0.72,
  branches: 4,
  spinTurns: 1.8,
};

export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const rotatingGroupRef = useRef<THREE.Group>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  const proximaMarkerRef = useRef<THREE.Group>(null);
  const proximaPulseRef = useRef<THREE.Mesh>(null);
  const proximaPulseRef2 = useRef<THREE.Mesh>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const markerWorldPos = useRef(new THREE.Vector3());
  const frameCountRef = useRef(0);
  const lodControllerRef = useRef(new LODController('high'));
  const [lodLevel, setLodLevel] = useState<LODLevel>('high');
  const lodLevelRef = useRef<LODLevel>('high');
  
  const { language } = useLanguage();
  const { camera } = useThree();

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const getObjectWorldPosition = useCosmosStore((s) => s.getObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  const currentScale = useCosmosStore((s) => s.currentScale);
  
  const showLabel = currentScale === 'stellar' || currentScale === 'milkyWay';
  const showYouAreHereMarker = showYouAreHere && (currentScale === 'stellar' || currentScale === 'milkyWay');

  const gs = UNITS.KM_PER_LY * visualScale;

  const earthObject = useMemo(() => getObjectById('earth'), []);
  const proximaObject = useMemo(() => getObjectById('proxima-centauri'), []);
  const milkyWayObject = useMemo(() => getObjectById('milky-way-center'), []);

  const handleYouAreHereClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (earthObject) setSelectedObject(earthObject);
  }, [earthObject, setSelectedObject]);

  const handleProximaClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (proximaObject) setSelectedObject(proximaObject);
  }, [proximaObject, setSelectedObject]);

  const handleMilkyWayClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (milkyWayObject) setSelectedObject(milkyWayObject);
  }, [milkyWayObject, setSelectedObject]);

  const handleYouAreHereLabelClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (earthObject) setSelectedObject(earthObject);
  }, [earthObject, setSelectedObject]);

  const handleProximaLabelClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (proximaObject) setSelectedObject(proximaObject);
  }, [proximaObject, setSelectedObject]);

  const galaxyOffset = useMemo<[number, number, number]>(
    () => [
      -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    ],
    [gs]
  );
  
  // Use shared textures instead of creating new ones
  const dotTexture = useMemo(() => getDotTexture(), []);
  const glowTexture = useMemo(() => getMilkyWayGlowTexture(), []);
  
  // Generate full-resolution geometries
  const starsGeoFull = useMemo(() => {
    const { branches, spinTurns } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const starCount = 400000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    const k = 5.0;
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

      const armWidth = 0.06 + rt * 0.12;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;
      const isInterArm = Math.random() < 0.35;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.8 + rt * 0.6) : 0;
      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      const radialSpread = (0.03 + rt * 0.06) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;
      const thickness = 0.012 + rt * 0.03;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;
      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      const rand = Math.random();
      if (rt < 0.15) {
        if (rand < 0.85) {
          color.setHSL(0.12 + Math.random() * 0.04, 0.95 + Math.random() * 0.05, 0.55 + Math.random() * 0.1);
        } else {
          color.setHSL(0.06 + Math.random() * 0.04, 1.0, 0.5 + Math.random() * 0.12);
        }
      } else if (rt < 0.3) {
        if (rand < 0.5) {
          color.setHSL(0.11 + Math.random() * 0.04, 0.95, 0.52 + Math.random() * 0.1);
        } else {
          color.setHSL(0.05 + Math.random() * 0.04, 1.0, 0.48 + Math.random() * 0.1);
        }
      } else if (rt < 0.5) {
        if (rand < 0.33) {
          color.setHSL(0.12 + Math.random() * 0.03, 0.92, 0.52 + Math.random() * 0.1);
        } else if (rand < 0.66) {
          color.setHSL(0.04 + Math.random() * 0.04, 1.0, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.78 + Math.random() * 0.08, 0.9, 0.45 + Math.random() * 0.12);
        }
      } else if (rt < 0.7) {
        if (rand < 0.5) {
          color.setHSL(0.76 + Math.random() * 0.08, 0.88, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.6 + Math.random() * 0.08, 0.92, 0.45 + Math.random() * 0.1);
        }
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.95, 0.4 + Math.random() * 0.12);
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
    const coreCount = 200000; // Increased for denser core
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = MILKY_WAY.bulgeRadius * gs * 0.8;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      // Higher exponent = more concentrated toward center
      const r = Math.pow(Math.random(), 2.0) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const rand = Math.random();
      // Brighter colors for core stars
      if (t < 0.4) {
        color.setHSL(0.12 + Math.random() * 0.03, 0.95, 0.65 + Math.random() * 0.1);
      } else if (rand < 0.7) {
        color.setHSL(0.11 + Math.random() * 0.04, 0.9, 0.6 + Math.random() * 0.12);
      } else {
        color.setHSL(0.06 + Math.random() * 0.04, 0.95, 0.55 + Math.random() * 0.12);
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

  const volumeGeoFull = useMemo(() => {
    const count = 100000;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.pow(Math.random(), 0.85);
      const radius = (0.15 + t * 0.85) * maxRadius;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;
      const ySpread = (0.12 + (1 - t) * 0.22) * maxRadius;
      positions[i3 + 1] = (Math.random() + Math.random() + Math.random() - 1.5) * ySpread * 0.08;

      const regionT = 0.15 + t * 0.85;
      const rand = Math.random();
      
      if (regionT < 0.25) {
        if (rand < 0.6) {
          color.setHSL(0.11 + Math.random() * 0.04, 0.95, 0.52 + Math.random() * 0.1);
        } else {
          color.setHSL(0.05 + Math.random() * 0.04, 1.0, 0.48 + Math.random() * 0.1);
        }
      } else if (regionT < 0.5) {
        if (rand < 0.33) {
          color.setHSL(0.11 + Math.random() * 0.03, 0.92, 0.52 + Math.random() * 0.1);
        } else if (rand < 0.66) {
          color.setHSL(0.04 + Math.random() * 0.04, 1.0, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.78 + Math.random() * 0.08, 0.9, 0.45 + Math.random() * 0.1);
        }
      } else if (regionT < 0.75) {
        if (rand < 0.5) {
          color.setHSL(0.76 + Math.random() * 0.08, 0.88, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.6 + Math.random() * 0.08, 0.92, 0.45 + Math.random() * 0.1);
        }
      } else {
        color.setHSL(0.58 + Math.random() * 0.08, 0.95, 0.4 + Math.random() * 0.1);
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
    const count = 25000;
    const maxRadius = MILKY_WAY.diskRadius * gs * 0.65;
    const maxHeight = MILKY_WAY.diskRadius * gs * 0.2;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const t = Math.pow(Math.random(), 2);
      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const heightScale = 0.25 + rt * 0.75;
      const y = (Math.random() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      const rand = Math.random();
      if (rand < 0.6) {
        color.setHSL(0.08 + Math.random() * 0.06, 0.85 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
      } else if (rand < 0.85) {
        color.setHSL(0.03 + Math.random() * 0.04, 0.9, 0.45 + Math.random() * 0.1);
      } else {
        color.setHSL(0.6 + Math.random() * 0.08, 0.8, 0.5 + Math.random() * 0.1);
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
  const volumeGeoLow = useMemo(() => createLODGeometry(volumeGeoFull, 'low'), [volumeGeoFull]);
  const haloGeoLow = useMemo(() => createLODGeometry(haloGeoFull, 'low'), [haloGeoFull]);

  // Select geometry based on current LOD
  const starsGeo = lodLevel === 'high' || lodLevel === 'medium' ? starsGeoFull : starsGeoLow;
  const coreGeo = lodLevel === 'high' || lodLevel === 'medium' ? coreGeoFull : coreGeoLow;
  const volumeGeo = lodLevel === 'high' || lodLevel === 'medium' ? volumeGeoFull : volumeGeoLow;
  const haloGeo = lodLevel === 'high' || lodLevel === 'medium' ? haloGeoFull : haloGeoLow;

  const sizeMultiplier = getParticleSizeMultiplier(lodLevel);

  useFrame(({ clock }) => {
    frameCountRef.current++;
    const t = clock.getElapsedTime();

    // Update LOD based on camera distance
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.getWorldPosition(centerWorldPos.current);

      const diskR = MILKY_WAY.diskRadius * gs;
      const { level } = lodControllerRef.current.update(
        camera.position,
        centerWorldPos.current,
        { galaxyDiameter: diskR * 2 }
      );

      if (level !== lodLevelRef.current) {
        lodLevelRef.current = level;
        setLodLevel(level);
      }

      // Throttle position updates for distant galaxies
      if (lodControllerRef.current.shouldUpdateThisFrame()) {
        const pos: [number, number, number] = [
          centerWorldPos.current.x,
          centerWorldPos.current.y,
          centerWorldPos.current.z,
        ];
        setObjectWorldPosition('milky-way-center', pos);
        setObjectWorldPosition('milkyWay_center', pos);
      }
    }

    // Proxima marker pulses
    if (proximaPulseRef.current) {
      const phase = (t * 2) % 1;
      proximaPulseRef.current.scale.setScalar(1 + phase * 4);
      (proximaPulseRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }

    if (proximaPulseRef2.current) {
      const phase = ((t * 2) + 0.5) % 1;
      proximaPulseRef2.current.scale.setScalar(1 + phase * 4);
      (proximaPulseRef2.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }

    // Update "We are here" marker position to track the solar system's live world position
    if (markerGroupRef.current) {
      const solarSystemPos = getObjectWorldPosition('solar-system-marker');
      if (solarSystemPos) {
        markerGroupRef.current.position.set(solarSystemPos[0], solarSystemPos[1], solarSystemPos[2]);
      }
      markerGroupRef.current.getWorldPosition(markerWorldPos.current);
      const distance = camera.position.distanceTo(markerWorldPos.current);
      const scale = Math.max(1, distance * 0.025);
      markerGroupRef.current.scale.setScalar(scale);
    }

    // Update Proxima marker position to track Proxima's live world position
    if (proximaMarkerRef.current) {
      const proximaPos = getObjectWorldPosition('proxima-centauri');
      if (proximaPos) {
        proximaMarkerRef.current.position.set(proximaPos[0], proximaPos[1], proximaPos[2]);
      }
      const worldPos = new THREE.Vector3();
      proximaMarkerRef.current.getWorldPosition(worldPos);
      const distance = camera.position.distanceTo(worldPos);
      const scale = Math.max(1, distance * 0.025);
      proximaMarkerRef.current.scale.setScalar(scale);
    }
  });
  
  const baseMarkerSize = gs * 300;
  const diskR = MILKY_WAY.diskRadius * gs;
  const proximaPosition: [number, number, number] = [5.80 * gs, -0.28 * gs, -6.16 * gs];

  return (
    <>
      <group ref={rotatingGroupRef} position={galaxyOffset}>
        <DifferentialRotationPoints
          key="milkyway-core"
          geometry={coreGeo}
          size={gs * 110 * sizeMultiplier}
          map={dotTexture}
          opacity={0.85}
          maxRadius={MILKY_WAY.bulgeRadius * gs}
          rotationMultiplier={1.5}
          differentialStrength={0.12}
        />

        <DifferentialRotationPoints
          key="milkyway-arms"
          geometry={starsGeo}
          size={gs * 60 * sizeMultiplier}
          map={dotTexture}
          opacity={0.28}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.08}
        />

        <DifferentialRotationPoints
          key="milkyway-volume"
          geometry={volumeGeo}
          size={gs * 55 * sizeMultiplier}
          map={dotTexture}
          opacity={0.14}
          maxRadius={diskR}
          rotationMultiplier={1}
          differentialStrength={0.08}
        />

        <DifferentialRotationPoints
          key="milkyway-halo"
          geometry={haloGeo}
          size={gs * 45 * sizeMultiplier}
          map={dotTexture}
          opacity={0.10}
          maxRadius={diskR * 1.2}
          rotationMultiplier={0.8}
          differentialStrength={0.06}
        />

        <sprite renderOrder={10} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>

        <sprite renderOrder={11} frustumCulled={false} scale={[diskR * 0.6, diskR * 0.6, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </sprite>

        <sprite renderOrder={12} frustumCulled={false} scale={[diskR * 0.25, diskR * 0.25, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </sprite>

        {/* Click target - reduced complexity from 32x32 to 8x8 */}
        <mesh 
          onClick={handleMilkyWayClick}
          onPointerDown={handleMilkyWayClick}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[diskR * 1.2, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {showYouAreHereMarker && (
        <group ref={markerGroupRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={1}
                array={new Float32Array([0, 0, 0])}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                count={1}
                array={new Float32Array([1, 1, 1])}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={gs * 120}
              map={dotTexture}
              vertexColors
              sizeAttenuation
              transparent
              opacity={1}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
            />
          </points>
          
          {/* Reduced click target complexity */}
          <mesh 
            onClick={handleYouAreHereClick} 
            onPointerDown={handleYouAreHereClick}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[baseMarkerSize * 40, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          
          {showLabel && (
            <Html
              position={[0, baseMarkerSize * 15, 0]}
              center
              distanceFactor={baseMarkerSize * 50}
              occlude={false}
              zIndexRange={[0, 0]}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer"
                onClick={handleYouAreHereLabelClick}
              >
                <span className="text-white text-sm font-semibold">
                  {language === 'fr' ? 'Nous sommes ici' : 'We are here'}
                </span>
              </div>
            </Html>
          )}
          
          <mesh onClick={handleYouAreHereClick} onPointerDown={handleYouAreHereClick}>
            <sphereGeometry args={[baseMarkerSize, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          
          <mesh onClick={handleYouAreHereClick} onPointerDown={handleYouAreHereClick}>
            <sphereGeometry args={[baseMarkerSize * 1.5, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh onClick={handleYouAreHereClick} onPointerDown={handleYouAreHereClick}>
            <sphereGeometry args={[baseMarkerSize * 3, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {showLabel && (
        <group ref={proximaMarkerRef}>
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={1}
                array={new Float32Array([0, 0, 0])}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                count={1}
                array={new Float32Array([1, 0.8, 0.8])}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={gs * 120}
              map={dotTexture}
              vertexColors
              sizeAttenuation
              transparent
              opacity={1}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest={false}
            />
          </points>
          
          {/* Reduced click target complexity */}
          <mesh 
            onClick={handleProximaClick} 
            onPointerDown={handleProximaClick}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[baseMarkerSize * 40, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          
          <Html
            position={[0, baseMarkerSize * 15, 0]}
            center
            distanceFactor={baseMarkerSize * 50}
            occlude={false}
            zIndexRange={[0, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-500/50 whitespace-nowrap shadow-lg cursor-pointer"
              onClick={handleProximaLabelClick}
            >
              <span className="text-orange-400 text-sm font-semibold drop-shadow-md">
                {language === 'fr' ? 'Proxima du Centaure' : 'Proxima Centauri'}
              </span>
            </div>
          </Html>
          
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 0.7, 8, 8]} />
            <meshBasicMaterial color="#ff6b4a" />
          </mesh>
          
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 1.2, 8, 8]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 2.5, 8, 8]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh ref={proximaPulseRef} rotation={[Math.PI / 2, 0, 0]} onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <ringGeometry args={[baseMarkerSize * 1.2, baseMarkerSize * 2, 16]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh ref={proximaPulseRef2} rotation={[Math.PI / 2, 0, 0]} onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <ringGeometry args={[baseMarkerSize * 1.2, baseMarkerSize * 2, 16]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </>
  );
};
