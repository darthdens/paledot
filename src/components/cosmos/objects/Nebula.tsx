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
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
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
  
  // Parse the hex color
  const color = useMemo(() => new THREE.Color(nebula.color), [nebula.color]);
  
  // Create particle cloud geometry
  const { geometry, texture } = useMemo(() => {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const baseColor = new THREE.Color(nebula.color);
    const radius = nebulaSize / 2;
    
    for (let i = 0; i < particleCount; i++) {
      // Gaussian-like distribution for more density in center
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.pow(Math.random(), 0.5); // More particles toward center
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3; // Flattened
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Color variation
      const colorVariation = 0.2 + Math.random() * 0.8;
      colors[i * 3] = baseColor.r * colorVariation;
      colors[i * 3 + 1] = baseColor.g * colorVariation;
      colors[i * 3 + 2] = baseColor.b * colorVariation;
      
      // Size variation
      sizes[i] = (0.5 + Math.random() * 1.5) * nebulaSize * 0.02;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return { geometry: geo, texture: createNebulaTexture() };
  }, [nebula.color, nebulaSize]);
  
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
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [texture]);
  
  // Update world position for camera tracking
  useFrame(() => {
    if (groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      setObjectWorldPosition(nebula.id, [worldPos.x, worldPos.y, worldPos.z]);
    }
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
        onClick={handleClick}
      />
      {/* Central glow */}
      <mesh onClick={handleClick}>
        <sphereGeometry args={[nebulaSize * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
