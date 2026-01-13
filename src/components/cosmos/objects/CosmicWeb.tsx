import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface CosmicWebProps {
  visualScale: number;
}

// Cosmic Web - the large-scale structure of the universe
// Observable universe radius: ~46.5 billion light-years (Bly)
// Filaments: 150-500 Mly long, 30-100 Mly wide
// Voids: 100-400 Mly diameter

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate nodes for cosmic web structure
// These represent galaxy cluster nodes where filaments intersect
const generateWebNodes = (count: number, maxRadius: number): THREE.Vector3[] => {
  const nodes: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = i * 7777;
    
    // Distribute across the observable universe with slight clustering
    const r = maxRadius * Math.pow(seededRandom(seed), 0.45);
    const theta = seededRandom(seed + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
    
    nodes.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.7, // Slightly flattened
      r * Math.sin(phi) * Math.sin(theta)
    ));
  }
  
  return nodes;
};

// Generate filament connections between nearby nodes
const generateFilaments = (nodes: THREE.Vector3[], maxConnectionDist: number) => {
  const connections: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    // Find nearby nodes
    const nearby: { idx: number; dist: number }[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = node.distanceTo(nodes[j]);
      if (dist < maxConnectionDist && dist > maxConnectionDist * 0.05) {
        nearby.push({ idx: j, dist });
      }
    }
    
    // Connect to 2-4 nearest neighbors
    nearby.sort((a, b) => a.dist - b.dist);
    const connectionCount = Math.min(2 + Math.floor(seededRandom(i * 123) * 2), nearby.length);
    
    for (let c = 0; c < connectionCount; c++) {
      const target = nodes[nearby[c].idx];
      const strength = 1 - (nearby[c].dist / maxConnectionDist);
      connections.push({ from: node, to: target, strength });
    }
  }
  
  return connections;
};

export const CosmicWeb = ({ visualScale }: CosmicWebProps) => {
  const filamentPointsRef = useRef<THREE.Points>(null);
  const nodePointsRef = useRef<THREE.Points>(null);
  const backgroundRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  // Observable universe radius in Mly: 46,500 Mly (46.5 Bly)
  const universeRadiusMly = 46500;
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { filamentGeometry, filamentMaterial, nodeGeometry, nodeMaterial, bgGeometry, bgMaterial } = useMemo(() => {
    // Generate web structure
    const nodeCount = 400;
    const maxRadius = universeRadiusMly;
    const nodes = generateWebNodes(nodeCount, maxRadius);
    const filaments = generateFilaments(nodes, maxRadius * 0.15);
    
    // Generate filament particles
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      // Distribute particles along each filament
      const segmentCount = 15 + Math.floor(seededRandom(fIdx * 111) * 15);
      const filamentWidth = 100 + seededRandom(fIdx * 222) * 150; // 100-250 Mly wide
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        
        // Interpolate along filament with some curve
        const seed = fIdx * 1000 + s;
        const perpOffset = (seededRandom(seed) - 0.5) * fil.from.distanceTo(fil.to) * 0.1;
        
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t;
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t;
        
        // Add particles around this point
        const particlesPerSegment = 3 + Math.floor(fil.strength * 5);
        for (let p = 0; p < particlesPerSegment; p++) {
          const pseed = seed + p * 100;
          const scatter = filamentWidth * (seededRandom(pseed) - 0.5);
          const scatterY = filamentWidth * 0.4 * (seededRandom(pseed + 1) - 0.5);
          const scatterZ = filamentWidth * (seededRandom(pseed + 2) - 0.5);
          
          filamentPositions.push(
            (baseX + scatter + perpOffset * Math.cos(t * Math.PI)) * mlyScale,
            (baseY + scatterY) * mlyScale,
            (baseZ + scatterZ + perpOffset * Math.sin(t * Math.PI)) * mlyScale
          );
          
          // Purple/magenta for filaments (like real cosmic web simulations)
          const hue = 0.78 + seededRandom(pseed + 3) * 0.1;
          const sat = 0.45 + seededRandom(pseed + 4) * 0.35;
          const light = 0.25 + fil.strength * 0.2 + seededRandom(pseed + 5) * 0.1;
          
          const color = new THREE.Color().setHSL(hue, sat, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push((0.3 + fil.strength * 0.5) * (0.6 + seededRandom(pseed + 6) * 0.4));
        }
      }
    });
    
    // Add more diffuse web structure filling the universe
    const webFillCount = 80000;
    for (let i = 0; i < webFillCount; i++) {
      const seed = i + 200000;
      
      const radius = universeRadiusMly * Math.pow(seededRandom(seed), 0.4);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      filamentPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * 0.55 * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      const hue = 0.6 + seededRandom(seed + 3) * 0.25;
      const color = new THREE.Color().setHSL(hue, 0.25, 0.2 + seededRandom(seed + 4) * 0.1);
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.1 + seededRandom(seed + 5) * 0.2);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Node geometry (bright cluster intersections)
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeSizes: number[] = [];
    
    nodes.forEach((node, idx) => {
      // Count connections to determine brightness
      const connectionCount = filaments.filter(f => 
        (f.from === node || f.to === node)
      ).length;
      const brightness = Math.min(0.4 + connectionCount * 0.15, 1.0);
      
      // Create cluster of particles at each node
      const particleCount = 15 + Math.floor(brightness * 30);
      
      for (let p = 0; p < particleCount; p++) {
        const seed = idx * 1000 + p;
        const scatter = 80 * (seededRandom(seed) - 0.5);
        
        nodePositions.push(
          (node.x + scatter) * mlyScale,
          (node.y + scatter * 0.5) * mlyScale,
          (node.z + scatter) * mlyScale
        );
        
        // Orange/yellow for nodes (galaxy clusters)
        const hue = 0.06 + seededRandom(seed + 1) * 0.08;
        const sat = 0.65 + seededRandom(seed + 2) * 0.25;
        const light = 0.4 + brightness * 0.3;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        nodeColors.push(color.r, color.g, color.b);
        nodeSizes.push((0.5 + brightness * 0.8) * (0.6 + seededRandom(seed + 3) * 0.4));
      }
    });
    
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nodeColors), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(nodeSizes), 1));
    nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Background - very distant galaxies filling the observable universe
    const bgPositions: number[] = [];
    const bgColors: number[] = [];
    const bgSizes: number[] = [];
    
    const bgCount = 100000;
    for (let i = 0; i < bgCount; i++) {
      const seed = i + 500000;
      
      const radius = universeRadiusMly * Math.pow(seededRandom(seed), 0.35);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      bgPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      // Very dim, white/blue tinted
      const distFactor = radius / universeRadiusMly;
      const light = 0.15 * (1 - distFactor * 0.5);
      const color = new THREE.Color().setHSL(0.6, 0.1, light);
      bgColors.push(color.r, color.g, color.b);
      bgSizes.push(0.05 + seededRandom(seed + 3) * 0.1);
    }
    
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bgPositions), 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bgColors), 3));
    bgGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(bgSizes), 1));
    bgGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Shared texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, texSize, texSize);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const createMaterial = (sizeMultiplier: number) => new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          float dist = -mvPosition.z;
          float pointSize = size * ${sizeMultiplier.toFixed(1)} / dist;
          gl_PointSize = clamp(pointSize, 0.5, 18.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec3 vColor;
        
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.01) discard;
          gl_FragColor = vec4(vColor, uOpacity) * tex;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    return {
      filamentGeometry: filamentGeo,
      filamentMaterial: createMaterial(800000.0),
      nodeGeometry: nodeGeo,
      nodeMaterial: createMaterial(1200000.0),
      bgGeometry: bgGeo,
      bgMaterial: createMaterial(500000.0),
    };
  }, [mlyScale, universeRadiusMly]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    
    // Fade in at Laniakea/Universe scales
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 200, mlyScale * 600);
    
    const filamentOpacity = fadeIn * 0.65;
    const nodeOpacity = fadeIn * 0.8;
    const bgOpacity = fadeIn * 0.4;
    
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = filamentOpacity;
    }
    if (nodePointsRef.current) {
      (nodeMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = nodeOpacity;
    }
    if (backgroundRef.current) {
      (bgMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = bgOpacity;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <>
      <points 
        ref={backgroundRef} 
        geometry={bgGeometry} 
        material={bgMaterial} 
        frustumCulled={false} 
      />
      <points 
        ref={filamentPointsRef} 
        geometry={filamentGeometry} 
        material={filamentMaterial} 
        frustumCulled={false} 
      />
      <points 
        ref={nodePointsRef} 
        geometry={nodeGeometry} 
        material={nodeMaterial} 
        frustumCulled={false} 
      />
    </>
  );
};