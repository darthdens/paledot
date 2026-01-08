// AsteroidBelt - Renders thousands of small asteroids between Mars and Jupiter
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface AsteroidBeltProps {
  innerRadius: number;  // Mars orbit ~228M km
  outerRadius: number;  // Jupiter orbit ~778M km - we use inner edge of Jupiter
  count?: number;
  scale?: number;
}

// Pre-generate asteroid data for performance
const generateAsteroids = (count: number, innerRadius: number, outerRadius: number) => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  
  // Asteroid belt is concentrated between 2.2 and 3.2 AU
  // with gaps (Kirkwood gaps) at certain resonances
  const beltCenter = (innerRadius + outerRadius) / 2;
  const beltWidth = outerRadius - innerRadius;
  
  for (let i = 0; i < count; i++) {
    // Use gaussian-like distribution centered in the belt
    // Avoid Kirkwood gaps (simplified - just make distribution lumpy)
    let radius: number;
    const rand = Math.random();
    if (rand < 0.7) {
      // Main belt (concentrated)
      radius = innerRadius + beltWidth * (0.2 + Math.random() * 0.5);
    } else if (rand < 0.9) {
      // Inner belt
      radius = innerRadius + beltWidth * Math.random() * 0.25;
    } else {
      // Outer belt (Hildas and Trojans region - sparser)
      radius = innerRadius + beltWidth * (0.7 + Math.random() * 0.3);
    }
    
    // Add some eccentricity - asteroids don't have perfect circular orbits
    const eccentricity = (Math.random() - 0.5) * 0.15;
    radius *= (1 + eccentricity);
    
    const angle = Math.random() * Math.PI * 2;
    
    // Slight inclination for 3D effect
    const inclination = (Math.random() - 0.5) * 0.08;
    const y = Math.sin(inclination) * radius * 0.1;
    
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    
    // Most asteroids are small, few are larger (power law distribution)
    const sizeRand = Math.random();
    if (sizeRand > 0.995) {
      sizes[i] = 800 + Math.random() * 400; // Ceres-class (very rare)
    } else if (sizeRand > 0.95) {
      sizes[i] = 200 + Math.random() * 300; // Large asteroids
    } else if (sizeRand > 0.7) {
      sizes[i] = 50 + Math.random() * 150; // Medium asteroids
    } else {
      sizes[i] = 10 + Math.random() * 40; // Small asteroids (most common)
    }
    
    // Orbital speed varies with distance (Kepler's laws - farther = slower)
    const normalizedRadius = (radius - innerRadius) / beltWidth;
    speeds[i] = 0.0003 / Math.sqrt(1 + normalizedRadius);
    
    // Random starting phase
    phases[i] = angle;
    
    // Asteroid colors - mostly gray/brown variations
    const colorType = Math.random();
    if (colorType < 0.6) {
      // C-type (carbonaceous) - dark gray
      const gray = 0.25 + Math.random() * 0.15;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray;
      colors[i * 3 + 2] = gray;
    } else if (colorType < 0.85) {
      // S-type (silicaceous) - brownish
      colors[i * 3] = 0.45 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.35 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.25 + Math.random() * 0.1;
    } else {
      // M-type (metallic) - lighter gray
      const gray = 0.4 + Math.random() * 0.2;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray * 0.95;
      colors[i * 3 + 2] = gray * 0.9;
    }
  }
  
  return { positions, sizes, speeds, phases, colors };
};

export const AsteroidBelt = ({ 
  innerRadius, 
  outerRadius, 
  count = 3000,
  scale = 1 
}: AsteroidBeltProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const simTime = useRef(0);
  
  const asteroidData = useMemo(() => 
    generateAsteroids(count, innerRadius, outerRadius),
    [count, innerRadius, outerRadius]
  );
  
  // Create geometry with positions and colors
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(asteroidData.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(asteroidData.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(asteroidData.sizes, 1));
    return geo;
  }, [asteroidData]);
  
  // Shader material for size attenuation and lighting
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: scale * 50 },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vDist;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = length(mvPosition.xyz);
        
        // Size attenuation - asteroids get smaller with distance
        float attenuation = 300.0 / vDist;
        gl_PointSize = size * attenuation;
        gl_PointSize = clamp(gl_PointSize, 1.0, 15.0);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDist;
      
      void main() {
        // Circular points
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Simple lighting - brighter facing sun (at origin)
        float lighting = 0.4 + 0.6 * (1.0 - dist * 2.0);
        
        // Fade with distance
        float fade = clamp(1.0 - vDist / 50000000.0, 0.3, 1.0);
        
        gl_FragColor = vec4(vColor * lighting * fade, 1.0);
      }
    `,
    transparent: false,
    vertexColors: true,
  }), [scale]);
  
  // Animate orbital motion
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    simTime.current += delta * timeSpeed;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { speeds, phases } = asteroidData;
    
    // Update positions based on orbital motion
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const radius = Math.sqrt(x * x + z * z);
      
      // Current angle + rotation based on speed and time
      const currentAngle = phases[i] + simTime.current * speeds[i];
      
      positions[i * 3] = Math.cos(currentAngle) * radius;
      positions[i * 3 + 2] = Math.sin(currentAngle) * radius;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};
