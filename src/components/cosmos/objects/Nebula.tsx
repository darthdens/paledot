import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import type { CelestialObject } from '../types';

interface NebulaProps {
  nebula: CelestialObject;
  visualScale: number;
}

// Create a soft glow texture for nebula particles
const createNebulaTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

export const Nebula = ({ nebula, visualScale }: NebulaProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const lastWorldUpdate = useRef(0);
  
  const setSelectedObject = useCosmosStore((s) => s.setSelectedObject);
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);
  
  // Scale factor for light-year based coordinates (matching MilkyWayGalaxy)
  const gs = UNITS.KM_PER_LY * visualScale;
  
  // Position in scene units (nebula position is in light-years)
  const position = useMemo<[number, number, number]>(() => [
    nebula.position[0] * gs,
    nebula.position[1] * gs,
    nebula.position[2] * gs,
  ], [nebula.position, gs]);
  
  // Size in scene units - nebula.size is the diameter in light-years
  // 5x visual boost for better visibility while maintaining reasonable proportions
  const nebulaSize = nebula.size * gs * 5;
  
  // Orion Nebula specific colors: pink/magenta core, blue outer regions, some orange
  const isOrion = nebula.id === 'orion-nebula';
  
  // Create particle cloud geometry - more realistic nebula shape
  const { geometry, texture } = useMemo(() => {
    const particleCount = 5000; // More particles for detail
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const radius = nebulaSize / 2;
    
    // Orion Nebula colors
    const pinkCore = new THREE.Color('#ff1493'); // Deep pink
    const magenta = new THREE.Color('#ff69b4'); // Hot pink
    const blue = new THREE.Color('#4169e1'); // Royal blue
    const orange = new THREE.Color('#ff6b35'); // Orange-red (from ionized gas)
    const white = new THREE.Color('#ffffff'); // Bright stars
    
    // Fallback for other nebulae
    const baseColor = new THREE.Color(nebula.color);
    
    for (let i = 0; i < particleCount; i++) {
      // Create irregular, wispy distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      // Irregular radius with filamentary structure
      const baseR = Math.pow(Math.random(), 0.4); // More spread out
      const noise = 0.3 * Math.sin(theta * 3) * Math.cos(phi * 2); // Wispy patterns
      const r = radius * (baseR + noise * baseR);
      
      // Asymmetric shape - Orion has a distinctive wing-like appearance
      const asymmetry = isOrion ? (1 + 0.5 * Math.sin(theta * 2)) : 1;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * asymmetry;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.4; // Flattened
      positions[i * 3 + 2] = r * Math.cos(phi) * (0.8 + 0.2 * Math.cos(theta));
      
      // Color based on distance from center
      const distFromCenter = baseR;
      let particleColor: THREE.Color;
      
      if (isOrion) {
        if (distFromCenter < 0.15) {
          // Bright core - white/pink with occasional bright stars
          particleColor = Math.random() < 0.3 ? white : pinkCore;
        } else if (distFromCenter < 0.4) {
          // Inner region - pink/magenta
          particleColor = magenta.clone().lerp(pinkCore, Math.random());
        } else if (distFromCenter < 0.7) {
          // Mid region - mix of pink, orange, and blue
          const mix = Math.random();
          if (mix < 0.4) {
            particleColor = magenta.clone().lerp(orange, Math.random() * 0.5);
          } else if (mix < 0.7) {
            particleColor = blue.clone().lerp(magenta, Math.random() * 0.3);
          } else {
            particleColor = orange.clone();
          }
        } else {
          // Outer region - fading blue with some pink wisps
          particleColor = blue.clone().lerp(magenta, Math.random() * 0.2);
        }
        
        // Add some variation
        const variation = 0.7 + Math.random() * 0.3;
        particleColor.multiplyScalar(variation);
      } else {
        // Generic nebula coloring
        const colorVariation = 0.3 + Math.random() * 0.7;
        particleColor = baseColor.clone().multiplyScalar(colorVariation);
      }
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
      
      // Size variation - smaller particles at edges, larger in core
      const sizeBase = isOrion 
        ? (distFromCenter < 0.3 ? 1.5 : 0.5 + Math.random())
        : (0.5 + Math.random() * 1.5);
      sizes[i] = sizeBase * nebulaSize * 0.015;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return { geometry: geo, texture: createNebulaTexture() };
  }, [nebula.color, nebula.id, nebulaSize, isOrion]);
  
  // Custom shader material for size attenuation
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: texture },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Prevent size "explosions" when the camera gets too close (reduces flicker)
          float z = max(1.0, -mvPosition.z);
          gl_PointSize = clamp(size * (300.0 / z), 0.0, 120.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
  }, [texture]);
  
  // Update world position for camera tracking (throttled to reduce jitter/flicker)
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();
    if (t - lastWorldUpdate.current < 0.1) return; // ~10 updates/sec is enough
    lastWorldUpdate.current = t;

    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    setObjectWorldPosition(nebula.id, [worldPos.x, worldPos.y, worldPos.z]);
  });
  
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(nebula);
  };
  
  return (
    <group ref={groupRef} position={position}>
      <points
        ref={pointsRef}
        geometry={geometry}
        material={material}
        frustumCulled={false}
        onClick={handleClick}
      />
      {/* Bright core glow - Trapezium region for Orion */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[nebulaSize * 0.08, 16, 16]} />
        <meshBasicMaterial
          color={isOrion ? '#ff69b4' : nebula.color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Outer diffuse glow */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[nebulaSize * 0.25, 16, 16]} />
        <meshBasicMaterial
          color={isOrion ? '#4169e1' : nebula.color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
