// KuiperBelt - Renders icy objects beyond Neptune
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';
import { UNITS } from '../types';

interface KuiperBeltProps {
  innerRadius: number;  // Neptune orbit ~4.5B km (30 AU)
  outerRadius: number;  // Extends to ~7.5B km (50 AU)
  count?: number;
  scale?: number;
}

const generateKuiperObjects = (count: number, innerRadius: number, outerRadius: number, distanceScale: number) => {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const radii = new Float32Array(count);     // Store orbital radii
  const heights = new Float32Array(count);   // Store Y positions
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  
  const beltWidth = outerRadius - innerRadius;
  
  for (let i = 0; i < count; i++) {
    // Kuiper belt has classical belt (42-48 AU) and scattered disc
    let radius: number;
    const rand = Math.random();
    if (rand < 0.6) {
      // Classical Kuiper Belt (cubewanos) - 42-48 AU concentrated
      radius = innerRadius + beltWidth * (0.3 + Math.random() * 0.35);
    } else if (rand < 0.85) {
      // Resonant objects (plutinos at 39 AU, twotinos, etc)
      radius = innerRadius + beltWidth * (0.2 + Math.random() * 0.15);
    } else {
      // Scattered disc - extends further out
      radius = innerRadius + beltWidth * (0.5 + Math.random() * 0.5);
    }
    
    // Higher eccentricity than asteroid belt
    const eccentricity = (Math.random() - 0.5) * 0.25;
    radius *= (1 + eccentricity);
    
    const angle = Math.random() * Math.PI * 2;
    
    // Higher inclination than asteroid belt
    const inclination = (Math.random() - 0.5) * 0.2;
    const y = Math.sin(inclination) * radius * 0.15;
    
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    
    // Store for animation
    radii[i] = radius;
    heights[i] = y;
    
    // Size distribution - most are small icy bodies
    const sizeRand = Math.random();
    if (sizeRand > 0.998) {
      sizes[i] = 1500 + Math.random() * 1000; // Pluto/Eris class (very rare)
    } else if (sizeRand > 0.99) {
      sizes[i] = 500 + Math.random() * 800; // Large KBOs
    } else if (sizeRand > 0.9) {
      sizes[i] = 100 + Math.random() * 300; // Medium KBOs
    } else {
      sizes[i] = 20 + Math.random() * 80; // Small icy bodies
    }
    
    // Orbital speed using Kepler's law - same formula as planets/asteroids
    // Convert scene units back to km, then to AU
    const radiusKm = distanceScale > 0 ? radius / distanceScale : radius;
    const semiMajorAxisAu = Math.max(radiusKm / UNITS.KM_PER_AU, 1e-6);
    // Kepler's third law: periodYears = a^(3/2)
    const periodDays = 365.25 * Math.pow(semiMajorAxisAu, 1.5);
    // Scale: 1 Earth year (365.25 days) = 240 seconds at 1x speed
    speeds[i] = (2 * Math.PI * 365.25) / (periodDays * 240);
    
    phases[i] = angle;
    
    // KBO colors - mostly reddish/tan icy bodies
    const colorType = Math.random();
    if (colorType < 0.4) {
      // Red/reddish (tholins) - most common
      colors[i * 3] = 0.5 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.35 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.1;
    } else if (colorType < 0.7) {
      // Neutral/gray
      const gray = 0.4 + Math.random() * 0.2;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray;
      colors[i * 3 + 2] = gray;
    } else if (colorType < 0.9) {
      // Bluish (fresh ice)
      colors[i * 3] = 0.5 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.55 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.65 + Math.random() * 0.15;
    } else {
      // Very red (ultra-red matter)
      colors[i * 3] = 0.6 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.25 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
    }
  }
  
  return { positions, sizes, radii, heights, speeds, phases, colors };
};

export const KuiperBelt = ({ 
  innerRadius, 
  outerRadius, 
  count = 2000,
  scale = 1 
}: KuiperBeltProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const simTime = useRef(0);
  
  const kuiperData = useMemo(() => 
    generateKuiperObjects(count, innerRadius, outerRadius, scale),
    [count, innerRadius, outerRadius, scale]
  );
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(kuiperData.positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(kuiperData.colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(kuiperData.sizes, 1));
    return geo;
  }, [kuiperData]);
  
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: scale * 80 },
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
        
        float attenuation = 500.0 / max(vDist, 1.0);
        gl_PointSize = aSize * attenuation;
        gl_PointSize = clamp(gl_PointSize, 0.5, 12.0);
        
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
        
        // Dimmer than asteroid belt (further from sun)
        float lighting = 0.25 + 0.5 * (1.0 - dist * 2.0);
        float fade = clamp(1.0 - vDist / 100000000.0, 0.2, 1.0);
        
        gl_FragColor = vec4(vColor * lighting * fade, 1.0);
      }
    `,
    transparent: false,
  }), [scale]);
  
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    simTime.current += delta * timeSpeed;
    
    const positions = pointsRef.current.geometry.attributes["position"]!.array as Float32Array;
    const { radii, heights, speeds, phases } = kuiperData;
    
    // Update positions using stored radii (same approach as AsteroidBelt)
    for (let i = 0; i < count; i++) {
      const radius = radii[i];
      const currentAngle = phases[i]! + simTime.current * speeds[i]!;
      
      positions[i * 3] = Math.cos(currentAngle) * radius!;
      positions[i * 3 + 1] = heights[i]; // Keep original height
      positions[i * 3 + 2] = Math.sin(currentAngle) * radius!;
    }
    
    pointsRef.current.geometry.attributes["position"]!.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};
