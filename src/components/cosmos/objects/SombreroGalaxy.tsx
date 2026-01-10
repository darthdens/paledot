import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { getObjectById } from '../data/celestialObjects';

interface SombreroGalaxyProps {
  visualScale: number;
}

// Sombrero Galaxy (M104) parameters - based on real data
// Distance: 29.3 million light-years from Earth
// Diameter: ~50,000 light-years
// Famous for its edge-on orientation with a large central bulge
// and a prominent dark dust lane cutting across the disk
// 
// Key visual features from reference images:
// 1. Huge bright central bulge (the "crown" of the hat)
// 2. Thin disk with a dark dust lane (the "brim")
// 3. Viewed nearly edge-on (~6° from edge-on)
// 4. Colors: bright white/cream bulge, orange-brown dust lane, blue outer regions
const SOMBRERO = {
  diskRadius: 25000, // Half of 50,000 ly diameter
  bulgeRadius: 12000, // Central bulge width (slightly narrower for more elongated look)
  bulgeHeight: 18000, // Much taller elliptical bulge - the iconic "hat crown"
  dustLaneThickness: 1000, // Prominent dust lane
  inclination: (84 * Math.PI) / 180, // Nearly edge-on (84° from face-on)
  distanceFromMilkyWay: 29.3e6, // 29.3 million light-years
};

// Sombrero glow texture: bright white center to cream/golden halo to fade
const createSombreroGlowTexture = () => {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  // Bright white/cream center → golden glow → fade
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');       // Brilliant white center
  gradient.addColorStop(0.05, 'rgba(255, 252, 240, 0.95)'); // Warm white
  gradient.addColorStop(0.12, 'rgba(255, 245, 220, 0.85)'); // Cream
  gradient.addColorStop(0.22, 'rgba(255, 235, 190, 0.7)');  // Golden cream
  gradient.addColorStop(0.35, 'rgba(255, 220, 160, 0.5)');  // Golden
  gradient.addColorStop(0.5, 'rgba(255, 200, 130, 0.3)');   // Orange-gold
  gradient.addColorStop(0.65, 'rgba(220, 180, 120, 0.18)'); // Fading gold
  gradient.addColorStop(0.8, 'rgba(180, 160, 140, 0.08)');  // Subtle haze
  gradient.addColorStop(1, 'rgba(150, 140, 130, 0)');       // Transparent

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

// Create dust lane texture (darker, brownish)
const createDustTexture = () => {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(80, 50, 30, 1)');
  gradient.addColorStop(0.3, 'rgba(60, 40, 25, 0.8)');
  gradient.addColorStop(0.6, 'rgba(40, 30, 20, 0.4)');
  gradient.addColorStop(1, 'rgba(20, 15, 10, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

export const SombreroGalaxy = ({ visualScale }: SombreroGalaxyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const centerWorldPos = useRef(new THREE.Vector3());

  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);

  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position: Sombrero is in the constellation Virgo
  // Place it in a different direction than other galaxies
  const sombreroPosition = useMemo<[number, number, number]>(() => [
    SOMBRERO.distanceFromMilkyWay * gs * 0.5,   // X component
    SOMBRERO.distanceFromMilkyWay * gs * -0.3,  // Below galactic plane
    SOMBRERO.distanceFromMilkyWay * gs * 0.82,  // Z component
  ], [gs]);

  const sombreroObject = useMemo(() => getObjectById('sombrero'), []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (sombreroObject) setSelectedObject(sombreroObject);
  }, [sombreroObject, setSelectedObject]);

  const dotTexture = useMemo(() => createDotTexture(), []);
  const dustTexture = useMemo(() => createDustTexture(), []);
  const glowTexture = useMemo(() => createSombreroGlowTexture(), []);

  // Large central bulge - the distinctive "sombrero crown"
  // This is the most prominent feature - massive bright elliptical bulge
  // Based on reference: very bright white center, elongated vertically, smooth gradient to golden edges
  const bulgeGeo = useMemo(() => {
    const bulgeCount = 350000; // Very dense for bright, smooth appearance
    const positions = new Float32Array(bulgeCount * 3);
    const colors = new Float32Array(bulgeCount * 3);
    const color = new THREE.Color();
    const bulgeRadiusXZ = SOMBRERO.bulgeRadius * gs;
    const bulgeRadiusY = SOMBRERO.bulgeHeight * gs;

    for (let i = 0; i < bulgeCount; i++) {
      const i3 = i * 3;

      // Create an ellipsoidal distribution with concentration toward center
      const r = Math.pow(Math.random(), 1.6); // More concentration in center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Distance from center (0 to 1)
      const t = r;

      // Ellipsoidal coordinates - much taller than wide (the sombrero crown shape)
      const x = r * Math.sin(phi) * Math.cos(theta) * bulgeRadiusXZ;
      const y = r * Math.cos(phi) * bulgeRadiusY;
      const z = r * Math.sin(phi) * Math.sin(theta) * bulgeRadiusXZ;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Colors based on reference images:
      // - Brilliant white/cream center that's very bright
      // - Gradual transition to golden/orange at edges
      // - Overall warm tone
      const rand = Math.random();
      if (t < 0.08) {
        // Very center: brilliant pure white - maximum brightness
        color.setHSL(0.14 + Math.random() * 0.02, 0.05 + Math.random() * 0.03, 0.97 + Math.random() * 0.03);
      } else if (t < 0.18) {
        // Inner core: warm white
        color.setHSL(0.12 + Math.random() * 0.03, 0.08 + Math.random() * 0.05, 0.94 + Math.random() * 0.05);
      } else if (t < 0.3) {
        // Inner bulge: cream white
        color.setHSL(0.11 + Math.random() * 0.03, 0.12 + Math.random() * 0.06, 0.90 + Math.random() * 0.06);
      } else if (t < 0.45) {
        // Mid-inner bulge: light cream
        if (rand < 0.8) {
          color.setHSL(0.10 + Math.random() * 0.03, 0.18 + Math.random() * 0.08, 0.84 + Math.random() * 0.08);
        } else {
          color.setHSL(0.09 + Math.random() * 0.03, 0.22 + Math.random() * 0.1, 0.80 + Math.random() * 0.08);
        }
      } else if (t < 0.6) {
        // Middle bulge: cream/golden
        if (rand < 0.7) {
          color.setHSL(0.09 + Math.random() * 0.03, 0.25 + Math.random() * 0.12, 0.76 + Math.random() * 0.1);
        } else {
          color.setHSL(0.08 + Math.random() * 0.03, 0.32 + Math.random() * 0.12, 0.70 + Math.random() * 0.1);
        }
      } else if (t < 0.75) {
        // Outer-mid bulge: golden
        if (rand < 0.6) {
          color.setHSL(0.08 + Math.random() * 0.03, 0.38 + Math.random() * 0.15, 0.65 + Math.random() * 0.1);
        } else {
          color.setHSL(0.07 + Math.random() * 0.03, 0.45 + Math.random() * 0.15, 0.58 + Math.random() * 0.1);
        }
      } else if (t < 0.88) {
        // Outer bulge: golden/orange
        if (rand < 0.5) {
          color.setHSL(0.07 + Math.random() * 0.03, 0.48 + Math.random() * 0.18, 0.52 + Math.random() * 0.1);
        } else {
          color.setHSL(0.06 + Math.random() * 0.03, 0.52 + Math.random() * 0.18, 0.48 + Math.random() * 0.1);
        }
      } else {
        // Edge: orange fading
        color.setHSL(0.06 + Math.random() * 0.03, 0.5 + Math.random() * 0.2, 0.42 + Math.random() * 0.12);
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

  // Disk stars - the thin disk with spiral structure (seen edge-on)
  const diskGeo = useMemo(() => {
    const diskCount = 150000;
    const positions = new Float32Array(diskCount * 3);
    const colors = new Float32Array(diskCount * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const diskThickness = maxRadius * 0.015; // Very thin disk

    for (let i = 0; i < diskCount; i++) {
      const i3 = i * 3;

      // Exponential disk profile
      const u = Math.random();
      const k = 3.5;
      const t = -Math.log(1 - u * (1 - Math.exp(-k))) / k;
      
      const innerRadius = maxRadius * 0.25; // Start after bulge
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const rt = (radius - innerRadius) / (maxRadius - innerRadius);

      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      // Very thin disk
      const yJitter = (Math.random() * 2 - 1) * diskThickness * (1 + rt * 0.5);
      positions[i3 + 1] = yJitter;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Disk colors: mix of older yellow/orange stars and some blue regions
      const rand = Math.random();
      if (rt < 0.3) {
        // Inner disk near bulge: golden/orange
        color.setHSL(0.08 + Math.random() * 0.04, 0.4 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else if (rand < 0.15) {
        // Blue star-forming regions (sparse)
        color.setHSL(0.58 + Math.random() * 0.08, 0.7 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else if (rand < 0.5) {
        // White/cream stars
        color.setHSL(0.1 + Math.random() * 0.04, 0.15 + Math.random() * 0.1, 0.7 + Math.random() * 0.15);
      } else {
        // Yellow/orange older stars
        color.setHSL(0.07 + Math.random() * 0.05, 0.5 + Math.random() * 0.25, 0.5 + Math.random() * 0.15);
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

  // Dark dust lane - the iconic feature that creates the "brim" silhouette
  // This is what makes the Sombrero look like a hat - enhanced for prominence
  const dustLaneGeo = useMemo(() => {
    const dustCount = 180000; // Increased density for darker appearance
    const positions = new Float32Array(dustCount * 3);
    const colors = new Float32Array(dustCount * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.diskRadius * gs;
    const laneY = -SOMBRERO.dustLaneThickness * gs * 0.3; // Position in front of bulge
    const laneThickness = SOMBRERO.dustLaneThickness * gs * 1.2; // Thicker lane

    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;

      // Dust lane spans most of the disk with higher density
      const innerRadius = maxRadius * 0.08; // Start closer to center
      const t = Math.pow(Math.random(), 0.5); // More even distribution
      const radius = innerRadius + t * (maxRadius * 1.0 - innerRadius);
      const rt = radius / maxRadius;

      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      
      // Dust concentrated in a defined lane with clumpy structure
      const baseY = laneY;
      const ySpread = laneThickness * (0.3 + rt * 0.4);
      const yOffset = baseY + (Math.random() * 2 - 1) * ySpread;
      // Add clumpiness for realistic dust clouds
      const clump = Math.sin(angle * 7 + radius * 0.00015) * laneThickness * 0.25;
      const clump2 = Math.cos(angle * 11 - radius * 0.0001) * laneThickness * 0.15;
      positions[i3 + 1] = yOffset + clump + clump2;
      
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Dust colors: very dark brown/black for true silhouette
      const rand = Math.random();
      if (rand < 0.5) {
        // Very dark brown - nearly black
        color.setHSL(0.04 + Math.random() * 0.02, 0.7 + Math.random() * 0.2, 0.05 + Math.random() * 0.04);
      } else if (rand < 0.75) {
        // Dark reddish-brown
        color.setHSL(0.02 + Math.random() * 0.03, 0.8 + Math.random() * 0.15, 0.08 + Math.random() * 0.05);
      } else if (rand < 0.9) {
        // Slightly illuminated edge dust (orange-brown)
        const edgeFactor = Math.abs(Math.sin(angle * 2)) * 0.5;
        color.setHSL(0.05 + Math.random() * 0.03, 0.85 + Math.random() * 0.1, 0.12 + edgeFactor * 0.08);
      } else {
        // Pure dark clumps
        color.setHSL(0.03 + Math.random() * 0.02, 0.6 + Math.random() * 0.2, 0.03 + Math.random() * 0.03);
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

  // Halo - diffuse stellar halo around the galaxy
  const haloGeo = useMemo(() => {
    const count = 25000;
    const maxRadius = SOMBRERO.diskRadius * gs * 0.6;
    const maxHeight = SOMBRERO.bulgeHeight * gs * 0.8;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const t = Math.pow(Math.random(), 1.5);
      const innerRadius = maxRadius * 0.1;
      const radius = innerRadius + t * (maxRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 2] = Math.sin(angle) * radius;

      const rt = radius / maxRadius;
      const heightScale = 0.4 + rt * 0.6;
      const y = (Math.random() * 2 - 1) * maxHeight * heightScale;
      positions[i3 + 1] = y;

      // Halo: mostly old yellowish/orange stars
      const rand = Math.random();
      if (rand < 0.6) {
        // Yellow-orange
        color.setHSL(0.08 + Math.random() * 0.05, 0.35 + Math.random() * 0.2, 0.55 + Math.random() * 0.15);
      } else if (rand < 0.85) {
        // Cream/white
        color.setHSL(0.1 + Math.random() * 0.04, 0.15 + Math.random() * 0.1, 0.65 + Math.random() * 0.15);
      } else {
        // Redder old stars
        color.setHSL(0.04 + Math.random() * 0.04, 0.5 + Math.random() * 0.2, 0.45 + Math.random() * 0.12);
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

  // Globular clusters around the bulge (Sombrero has ~2000 globulars)
  const globularClustersGeo = useMemo(() => {
    const clusterCount = 3000; // Represent the dense globular cluster system
    const positions = new Float32Array(clusterCount * 3);
    const colors = new Float32Array(clusterCount * 3);
    const color = new THREE.Color();
    const maxRadius = SOMBRERO.bulgeRadius * gs * 1.5;

    for (let i = 0; i < clusterCount; i++) {
      const i3 = i * 3;

      // Spherical distribution centered on bulge
      const r = Math.pow(Math.random(), 0.8) * maxRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi) * 0.9; // Slightly flattened
      positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Globular clusters: old, yellowish
      color.setHSL(0.1 + Math.random() * 0.05, 0.3 + Math.random() * 0.2, 0.6 + Math.random() * 0.2);

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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.getWorldPosition(centerWorldPos.current);
      const pos: [number, number, number] = [
        centerWorldPos.current.x,
        centerWorldPos.current.y,
        centerWorldPos.current.z,
      ];
      setObjectWorldPosition('sombrero', pos);
    }
  });

  const diskR = SOMBRERO.diskRadius * gs;
  const bulgeR = SOMBRERO.bulgeRadius * gs;

  return (
    <group ref={groupRef} position={sombreroPosition}>
      {/* Apply edge-on orientation - we want to see the "sombrero" profile */}
      <group rotation={[SOMBRERO.inclination, 0.4, 0.1]}>
        
        {/* Halo - render first (behind everything) */}
        <points frustumCulled={false} renderOrder={1}>
          <bufferGeometry attach="geometry" {...haloGeo} />
          <pointsMaterial
            size={gs * 30}
            map={dotTexture}
            vertexColors
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Globular clusters */}
        <points frustumCulled={false} renderOrder={2}>
          <bufferGeometry attach="geometry" {...globularClustersGeo} />
          <pointsMaterial
            size={gs * 50}
            map={dotTexture}
            vertexColors
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Disk stars */}
        <points frustumCulled={false} renderOrder={3}>
          <bufferGeometry attach="geometry" {...diskGeo} />
          <pointsMaterial
            size={gs * 40}
            map={dotTexture}
            vertexColors
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Dark dust lane - the iconic feature - rendered with multiply blending for dark silhouette */}
        <points frustumCulled={false} renderOrder={6}>
          <bufferGeometry attach="geometry" {...dustLaneGeo} />
          <pointsMaterial
            size={gs * 55}
            map={dustTexture}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.MultiplyBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Central bulge - the bright "crown" - enhanced brightness */}
        <points frustumCulled={false} renderOrder={5}>
          <bufferGeometry attach="geometry" {...bulgeGeo} />
          <pointsMaterial
            size={gs * 80}
            map={dotTexture}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            sizeAttenuation
          />
        </points>

        {/* Center glow (billboard) - brilliant bright core with elongated shape */}
        <sprite renderOrder={7} frustumCulled={false} scale={[bulgeR * 2.2, bulgeR * 4.0, 1]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            opacity={1.0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </sprite>
      </group>

      {/* Click target */}
      <mesh 
        onClick={handleClick}
        onPointerDown={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[diskR * 1.2, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
