import { useRef, useMemo, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { useLanguage } from '@/i18n/LanguageContext';
import { getObjectById } from '../data/celestialObjects';

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
  spinTurns: 1.8, // how many turns the arms make from center to edge
};

// Simple crisp dot texture
const createDotTexture = () => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Galaxy glow texture with color gradient: yellow (center) → orange → purple → blue → fade
const createGalaxyGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Create radial gradient with color progression
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  // Yellow center → Orange → Purple → Blue → Fade to transparent
  gradient.addColorStop(0, 'rgba(255, 220, 80, 0.9)');      // Bright yellow center
  gradient.addColorStop(0.12, 'rgba(255, 180, 40, 0.7)');   // Yellow-orange
  gradient.addColorStop(0.25, 'rgba(255, 120, 30, 0.5)');   // Orange
  gradient.addColorStop(0.4, 'rgba(200, 80, 140, 0.35)');   // Orange-purple
  gradient.addColorStop(0.55, 'rgba(140, 70, 200, 0.25)');  // Purple
  gradient.addColorStop(0.7, 'rgba(80, 100, 220, 0.15)');   // Purple-blue
  gradient.addColorStop(0.85, 'rgba(50, 80, 180, 0.08)');   // Blue
  gradient.addColorStop(1, 'rgba(30, 50, 150, 0)');         // Fade to transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};


export const MilkyWayGalaxy = ({ visualScale, showYouAreHere = true }: MilkyWayGalaxyProps) => {
  const rotatingGroupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseRef2 = useRef<THREE.Mesh>(null);
  const markerGroupRef = useRef<THREE.Group>(null);
  const proximaMarkerRef = useRef<THREE.Group>(null);
  const proximaPulseRef = useRef<THREE.Mesh>(null);
  const proximaPulseRef2 = useRef<THREE.Mesh>(null);
  const centerWorldPos = useRef(new THREE.Vector3());
  const markerWorldPos = useRef(new THREE.Vector3());
  
  const { language } = useLanguage();

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  const currentScale = useCosmosStore((s) => s.currentScale);
  
  // Only show label at galaxy-scale views
  const showLabel = currentScale === 'stellar' || currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';

  const gs = UNITS.KM_PER_LY * visualScale;

  // Get celestial objects for click handlers
  const sunObject = useMemo(() => getObjectById('sun'), []);
  const proximaObject = useMemo(() => getObjectById('proxima-centauri'), []);

  // Click handlers
  const handleSunClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sunObject) setSelectedObject(sunObject);
  }, [sunObject, setSelectedObject]);

  const handleProximaClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (proximaObject) setSelectedObject(proximaObject);
  }, [proximaObject, setSelectedObject]);

  // Click handlers for HTML labels (DOM events)
  const handleSunLabelClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (sunObject) setSelectedObject(sunObject);
  }, [sunObject, setSelectedObject]);

  const handleProximaLabelClick = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (proximaObject) setSelectedObject(proximaObject);
  }, [proximaObject, setSelectedObject]);

  // Offset to position the galaxy so the solar system (Sun) stays at scene origin (0,0,0)
  // The galaxy center is displaced by the Sun's distance from galactic center
  const galaxyOffset = useMemo<[number, number, number]>(
    () => [
      -Math.cos(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
      0,
      -Math.sin(MILKY_WAY.sunAngle) * MILKY_WAY.sunDistance * gs,
    ],
    [gs]
  );
  
  const dotTexture = useMemo(() => createDotTexture(), []);
  const glowTexture = useMemo(() => createGalaxyGlowTexture(), []);
  
  // Generate ONLY stars - crisp dots with colors matching glow regions
  // Density decreases exponentially with distance from center
  const starsGeo = useMemo(() => {
    const { branches, spinTurns } = MILKY_WAY;
    const maxRadius = MILKY_WAY.diskRadius * gs;
    const starCount = 400000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    // Exponential radial falloff (higher = denser center, sparser edge)
    // t in [0..1], with PDF ~ exp(-k*t)
    const k = 5.0;
    const denom = 1 - Math.exp(-k);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Exponential distribution for radius fraction
      const u = Math.random();
      const t = -Math.log(1 - u * denom) / k;

      // Avoid stacking many points at x=z≈0 (creates a visible vertical "needle")
      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = radius / maxRadius;

      // Pick an arm
      const branchIndex = Math.floor(Math.random() * branches);
      const branchAngle = (branchIndex / branches) * Math.PI * 2;

      // Turn the arms as radius increases
      const spinAngle = rt * spinTurns * Math.PI * 2;

      // Arm thickness in radians
      const armWidth = 0.06 + rt * 0.12;
      const armJitter = (Math.random() + Math.random() + Math.random() - 1.5) * armWidth;

      // Inter-arm fill
      const isInterArm = Math.random() < 0.35;
      const interArmJitter = isInterArm ? (Math.random() - 0.5) * (0.8 + rt * 0.6) : 0;

      const angle = branchAngle + spinAngle + armJitter + interArmJitter;

      // Radial spread to make arms thicker horizontally (not just angular)
      const radialSpread = (0.03 + rt * 0.06) * maxRadius;
      const radialJitter = (Math.random() + Math.random() - 1) * radialSpread;
      const finalRadius = radius + radialJitter;

      positions[i3] = Math.cos(angle) * finalRadius;

      // Vertical thickness
      const thickness = 0.012 + rt * 0.03;
      const yJitter = (Math.random() + Math.random() + Math.random() - 1.5) * maxRadius * thickness;
      positions[i3 + 1] = yJitter;

      positions[i3 + 2] = Math.sin(angle) * finalRadius;

      // Star colors with diversity: yellow center → yellow+orange → yellow+orange+purple → purple+blue → blue
      // More saturated colors (less white), with mixing in transition zones
      const rand = Math.random();

      if (rt < 0.15) {
        // Center: mostly yellow, some orange - VIBRANT
        if (rand < 0.85) {
          // Yellow
          color.setHSL(0.12 + Math.random() * 0.04, 0.95 + Math.random() * 0.05, 0.55 + Math.random() * 0.1);
        } else {
          // Orange
          color.setHSL(0.06 + Math.random() * 0.04, 1.0, 0.5 + Math.random() * 0.12);
        }
      } else if (rt < 0.3) {
        // Yellow and orange mix - VIBRANT
        if (rand < 0.5) {
          // Yellow
          color.setHSL(0.11 + Math.random() * 0.04, 0.95, 0.52 + Math.random() * 0.1);
        } else {
          // Orange
          color.setHSL(0.05 + Math.random() * 0.04, 1.0, 0.48 + Math.random() * 0.1);
        }
      } else if (rt < 0.5) {
        // Yellow, orange, and purple mix - VIBRANT
        if (rand < 0.33) {
          // Yellow
          color.setHSL(0.12 + Math.random() * 0.03, 0.92, 0.52 + Math.random() * 0.1);
        } else if (rand < 0.66) {
          // Orange
          color.setHSL(0.04 + Math.random() * 0.04, 1.0, 0.45 + Math.random() * 0.1);
        } else {
          // Purple
          color.setHSL(0.78 + Math.random() * 0.08, 0.9, 0.45 + Math.random() * 0.12);
        }
      } else if (rt < 0.7) {
        // Purple and blue mix - VIBRANT
        if (rand < 0.5) {
          // Purple
          color.setHSL(0.76 + Math.random() * 0.08, 0.88, 0.45 + Math.random() * 0.1);
        } else {
          // Blue
          color.setHSL(0.6 + Math.random() * 0.08, 0.92, 0.45 + Math.random() * 0.1);
        }
      } else {
        // Outer: mostly blue - VIBRANT
        color.setHSL(0.58 + Math.random() * 0.08, 0.95, 0.4 + Math.random() * 0.12);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // Prevent frustum culling by setting infinite bounding sphere
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    return geo;
  }, [gs]);
  
  // Core bulge stars - denser center with golden color
  const coreGeo = useMemo(() => {
    const coreCount = 130000;
    const positions = new Float32Array(coreCount * 3);
    const colors = new Float32Array(coreCount * 3);
    const color = new THREE.Color();
    const coreRadius = MILKY_WAY.bulgeRadius * gs * 0.8;

    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;

      const r = Math.pow(Math.random(), 1.25) * coreRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = r / coreRadius; // 0 at center, 1 at edge

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.55;
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Core: mostly yellow with some orange - VIBRANT
      const rand = Math.random();
      if (t < 0.4) {
        // Inner core: bright yellow
        color.setHSL(0.12 + Math.random() * 0.03, 1.0, 0.55 + Math.random() * 0.08);
      } else if (rand < 0.7) {
        // Yellow
        color.setHSL(0.11 + Math.random() * 0.04, 0.95, 0.52 + Math.random() * 0.1);
      } else {
        // Orange
        color.setHSL(0.06 + Math.random() * 0.04, 1.0, 0.48 + Math.random() * 0.1);
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

  // Extra "volume" stars above/below disk - colored by region
  const volumeGeo = useMemo(() => {
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

      // Volume stars: same color logic as main stars
      const regionT = 0.15 + t * 0.85;
      const rand = Math.random();
      
      if (regionT < 0.25) {
        // Yellow/orange mix - VIBRANT
        if (rand < 0.6) {
          color.setHSL(0.11 + Math.random() * 0.04, 0.95, 0.52 + Math.random() * 0.1);
        } else {
          color.setHSL(0.05 + Math.random() * 0.04, 1.0, 0.48 + Math.random() * 0.1);
        }
      } else if (regionT < 0.5) {
        // Yellow, orange, purple mix - VIBRANT
        if (rand < 0.33) {
          color.setHSL(0.11 + Math.random() * 0.03, 0.92, 0.52 + Math.random() * 0.1);
        } else if (rand < 0.66) {
          color.setHSL(0.04 + Math.random() * 0.04, 1.0, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.78 + Math.random() * 0.08, 0.9, 0.45 + Math.random() * 0.1);
        }
      } else if (regionT < 0.75) {
        // Purple/blue mix - VIBRANT
        if (rand < 0.5) {
          color.setHSL(0.76 + Math.random() * 0.08, 0.88, 0.45 + Math.random() * 0.1);
        } else {
          color.setHSL(0.6 + Math.random() * 0.08, 0.92, 0.45 + Math.random() * 0.1);
        }
      } else {
        // Outer: blue - VIBRANT
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

  // Halo stars - scattered above/below the disk, denser near center
  const haloGeo = useMemo(() => {
    const count = 25000;
    const maxRadius = MILKY_WAY.diskRadius * gs * 0.65;
    const maxHeight = MILKY_WAY.diskRadius * gs * 0.2;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Concentrated toward center (power of 2 for falloff)
      const t = Math.pow(Math.random(), 2);
      const innerRadius = maxRadius * 0.02;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Vertical position: keep some thickness, but never stack points at x=z≈0
      const rt = radius / maxRadius;
      const heightScale = 0.25 + rt * 0.75;
      const y = (Math.random() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      // Halo stars: older, more yellow/orange, some ancient blue stragglers
      const rand = Math.random();
      if (rand < 0.6) {
        // Yellow-orange (old stars)
        color.setHSL(0.08 + Math.random() * 0.06, 0.85 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
      } else if (rand < 0.85) {
        // Orange-red
        color.setHSL(0.03 + Math.random() * 0.04, 0.9, 0.45 + Math.random() * 0.1);
      } else {
        // Rare blue stragglers
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
  
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // Galaxy rotation is handled by GalaxyRotator in CosmosExplorer

    // Keep the galaxy center world position live (needed for camera tracking while rotating)
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.getWorldPosition(centerWorldPos.current);

      // NOTE: selectable object id uses dashes (see celestialObjects.ts)
      const pos: [number, number, number] = [
        centerWorldPos.current.x,
        centerWorldPos.current.y,
        centerWorldPos.current.z,
      ];
      setObjectWorldPosition('milky-way-center', pos);

      // Back-compat with any older references
      setObjectWorldPosition('milkyWay_center', pos);
    }

    // Sun marker pulses
    if (pulseRef.current) {
      const phase = (t * 2) % 1;
      pulseRef.current.scale.setScalar(1 + phase * 4);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
    }

    if (pulseRef2.current) {
      const phase = ((t * 2) + 0.5) % 1;
      pulseRef2.current.scale.setScalar(1 + phase * 4);
      (pulseRef2.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.8;
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

    if (markerGroupRef.current) {
      markerGroupRef.current.getWorldPosition(markerWorldPos.current);

      const distance = camera.position.distanceTo(markerWorldPos.current);
      const scale = Math.max(1, distance * 0.025);
      markerGroupRef.current.scale.setScalar(scale);
    }

    // Scale Proxima marker similarly
    if (proximaMarkerRef.current) {
      const worldPos = new THREE.Vector3();
      proximaMarkerRef.current.getWorldPosition(worldPos);
      const distance = camera.position.distanceTo(worldPos);
      const scale = Math.max(1, distance * 0.025);
      proximaMarkerRef.current.scale.setScalar(scale);
    }
  });
  
  const baseMarkerSize = gs * 300;
  const diskR = MILKY_WAY.diskRadius * gs;
  
  // Proxima Centauri position in scene units (2x actual distance for visual separation)
  // Position in light-years: [5.80, -0.28, -6.16]
  const proximaPosition: [number, number, number] = [5.80 * gs, -0.28 * gs, -6.16 * gs];
  return (
    <>
      {/* Rotating galaxy group - offset so the solar system stays at origin */}
      <group ref={rotatingGroupRef} position={galaxyOffset}>
        <points geometry={coreGeo} frustumCulled={false}>
          <pointsMaterial
            size={gs * 100}
            map={dotTexture}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </points>

        {/* Main stars - spiral structure */}
        <points geometry={starsGeo} frustumCulled={false}>
          <pointsMaterial
            size={gs * 60}
            map={dotTexture}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </points>

        {/* Volume stars - add height so it feels "full" */}
        <points geometry={volumeGeo} frustumCulled={false}>
          <pointsMaterial
            size={gs * 55}
            map={dotTexture}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </points>

        {/* Halo stars - scattered above/below the disk */}
        <points geometry={haloGeo} frustumCulled={false}>
          <pointsMaterial
            size={gs * 45}
            map={dotTexture}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </points>

        {/* Center glow (billboard) */}
        <sprite renderOrder={10} frustumCulled={false} scale={[diskR * 2.2, diskR * 2.2, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>
      </group>

      {/* Solar system marker ("You are here") - stays at origin since that's where the solar system is */}
      {showYouAreHere && (
        <group ref={markerGroupRef} position={[0, 0, 0]}>
          {/* White star point that matches the galaxy stars style */}
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
          
          {/* Invisible click target for star point - large size for easy clicking at galaxy scale */}
          <mesh 
            onClick={handleSunClick} 
            onPointerDown={handleSunClick}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[baseMarkerSize * 40, 32, 32]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          
          {/* "We are here" label */}
          {showLabel && (
            <Html
              position={[0, baseMarkerSize * 15, 0]}
              center
              distanceFactor={baseMarkerSize * 50}
              occlude={false}
              // Keep this label beneath app modals/overlays (e.g., Help & Controls)
              zIndexRange={[0, 0]}
              style={{ pointerEvents: 'auto' }}
            >
              <div
                className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-500/50 whitespace-nowrap shadow-lg cursor-pointer"
                onClick={handleSunLabelClick}
              >
                <span className="text-emerald-400 text-sm font-semibold drop-shadow-md">
                  {language === 'fr' ? 'Nous sommes ici' : 'We are here'}
                </span>
              </div>
            </Html>
          )}
          
          <mesh onClick={handleSunClick} onPointerDown={handleSunClick}>
            <sphereGeometry args={[baseMarkerSize, 16, 16]} />
            <meshBasicMaterial color="#00ff44" />
          </mesh>
          
          <mesh onClick={handleSunClick} onPointerDown={handleSunClick}>
            <sphereGeometry args={[baseMarkerSize * 1.5, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh onClick={handleSunClick} onPointerDown={handleSunClick}>
            <sphereGeometry args={[baseMarkerSize * 3, 16, 16]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]} onClick={handleSunClick} onPointerDown={handleSunClick}>
            <ringGeometry args={[baseMarkerSize * 1.5, baseMarkerSize * 2.5, 32]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh ref={pulseRef2} rotation={[Math.PI / 2, 0, 0]} onClick={handleSunClick} onPointerDown={handleSunClick}>
            <ringGeometry args={[baseMarkerSize * 1.5, baseMarkerSize * 2.5, 32]} />
            <meshBasicMaterial
              color="#00ff44"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {/* Proxima Centauri marker - visible at galaxy scales */}
      {showLabel && (
        <group ref={proximaMarkerRef} position={proximaPosition}>
          {/* Red-orange star point matching Proxima's color */}
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
          
          {/* Invisible click target for star point - large size for easy clicking at galaxy scale */}
          <mesh 
            onClick={handleProximaClick} 
            onPointerDown={handleProximaClick}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[baseMarkerSize * 40, 32, 32]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          
          {/* "Proxima Centauri" label */}
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
          
          {/* Core sphere - red/orange for red dwarf */}
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 0.7, 16, 16]} />
            <meshBasicMaterial color="#ff6b4a" />
          </mesh>
          
          {/* Inner glow */}
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 1.2, 16, 16]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <sphereGeometry args={[baseMarkerSize * 2.5, 16, 16]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Pulse rings */}
          <mesh ref={proximaPulseRef} rotation={[Math.PI / 2, 0, 0]} onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <ringGeometry args={[baseMarkerSize * 1.2, baseMarkerSize * 2, 32]} />
            <meshBasicMaterial
              color="#ff6b4a"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          <mesh ref={proximaPulseRef2} rotation={[Math.PI / 2, 0, 0]} onClick={handleProximaClick} onPointerDown={handleProximaClick}>
            <ringGeometry args={[baseMarkerSize * 1.2, baseMarkerSize * 2, 32]} />
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
