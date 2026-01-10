// TrojanAsteroids - Renders asteroids at Jupiter's L4 and L5 Lagrange points
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface TrojanAsteroidsProps {
  jupiterOrbitRadius: number;
  count?: number;
  scale?: number;
}

const generateTrojans = (count: number, orbitRadius: number, lagrangeAngle: number) => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const offsets = new Float32Array(count); // Offset from Lagrange point
  
  for (let i = 0; i < count; i++) {
    // Trojans cluster around L4 (leading) or L5 (trailing) - 60° ahead/behind Jupiter
    // They oscillate in a "tadpole" or "horseshoe" orbit around the Lagrange point
    const angleOffset = (Math.random() - 0.5) * 0.5; // ~30° spread
    const radiusOffset = (Math.random() - 0.5) * 0.15; // ~15% radial spread
    
    const angle = lagrangeAngle + angleOffset;
    const radius = orbitRadius * (1 + radiusOffset);
    
    // Slight inclination
    const inclination = (Math.random() - 0.5) * 0.1;
    const y = Math.sin(inclination) * radius * 0.08;
    
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    
    offsets[i] = angleOffset;
    
    // Size distribution
    const sizeRand = Math.random();
    if (sizeRand > 0.995) {
      sizes[i] = 150 + Math.random() * 100; // 624 Hektor class
    } else if (sizeRand > 0.95) {
      sizes[i] = 50 + Math.random() * 80;
    } else {
      sizes[i] = 10 + Math.random() * 40;
    }
    
    // Colors - similar to outer asteroid belt, D-type dominant
    const colorType = Math.random();
    if (colorType < 0.7) {
      // D-type (very dark, reddish)
      colors[i * 3] = 0.25 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.08;
      colors[i * 3 + 2] = 0.18 + Math.random() * 0.06;
    } else if (colorType < 0.9) {
      // P-type (dark, slightly less red)
      const gray = 0.22 + Math.random() * 0.1;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray * 0.95;
      colors[i * 3 + 2] = gray * 0.9;
    } else {
      // C-type (carbonaceous)
      const gray = 0.2 + Math.random() * 0.12;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray;
      colors[i * 3 + 2] = gray;
    }
  }
  
  return { positions, sizes, colors, offsets };
};

export const TrojanAsteroids = ({ 
  jupiterOrbitRadius, 
  count = 800,
  scale = 1 
}: TrojanAsteroidsProps) => {
  const l4Ref = useRef<THREE.Points>(null);
  const l5Ref = useRef<THREE.Points>(null);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const simTime = useRef(0);
  
  // L4 is 60° ahead of Jupiter, L5 is 60° behind
  const l4Angle = Math.PI / 3; // 60°
  const l5Angle = -Math.PI / 3; // -60°
  
  const l4Data = useMemo(() => 
    generateTrojans(count, jupiterOrbitRadius, l4Angle),
    [count, jupiterOrbitRadius]
  );
  
  const l5Data = useMemo(() => 
    generateTrojans(count, jupiterOrbitRadius, l5Angle),
    [count, jupiterOrbitRadius]
  );
  
  const createGeometry = (data: ReturnType<typeof generateTrojans>) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1));
    return geo;
  };
  
  const l4Geometry = useMemo(() => createGeometry(l4Data), [l4Data]);
  const l5Geometry = useMemo(() => createGeometry(l5Data), [l5Data]);
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: scale * 50 },
    },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vDist;
      
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = length(mvPosition.xyz);
        
        float attenuation = 300.0 / max(vDist, 1.0);
        gl_PointSize = aSize * attenuation;
        gl_PointSize = clamp(gl_PointSize, 1.0, 12.0);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDist;
      
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;
        
        float lighting = 0.35 + 0.5 * (1.0 - dist * 2.0);
        float fade = clamp(1.0 - vDist / 50000000.0, 0.3, 1.0);
        
        gl_FragColor = vec4(vColor * lighting * fade, 1.0);
      }
    `,
    transparent: false,
  }), [scale]);
  
  // Jupiter's orbital period is about 11.86 years
  // Angular velocity = 2π / (11.86 * 365.25 * 240) at 1x speed (slower for better viewing)
  const jupiterAngularVelocity = (2 * Math.PI * 365.25) / (4332.59 * 240);
  
  useFrame((_, delta) => {
    simTime.current += delta * timeSpeed;
    const jupiterAngle = simTime.current * jupiterAngularVelocity;
    
    // Trojans orbit with Jupiter, maintaining their relative position
    if (l4Ref.current) {
      l4Ref.current.rotation.y = jupiterAngle;
    }
    if (l5Ref.current) {
      l5Ref.current.rotation.y = jupiterAngle;
    }
  });
  
  return (
    <>
      <points ref={l4Ref} geometry={l4Geometry} material={material} />
      <points ref={l5Ref} geometry={l5Geometry} material={material} />
    </>
  );
};
