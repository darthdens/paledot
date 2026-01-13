import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface CosmicWebProps {
  visualScale: number;
}

// Cosmic Web - the large-scale structure of the universe
// Filaments connect galaxy clusters, with voids in between
// Observable universe: ~93 billion light-years diameter
// Structure becomes apparent at Laniakea and Universe scales

interface FilamentNode {
  position: [number, number, number]; // in Mly
  brightness: number;
}

interface Filament {
  nodes: FilamentNode[];
  width: number;
  density: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate procedural cosmic web structure
// Based on research: filaments 150-500 Mly long, 30-80 Mly wide
const generateCosmicWeb = (): { filaments: Filament[], nodes: FilamentNode[] } => {
  const filaments: Filament[] = [];
  const majorNodes: FilamentNode[] = [];
  
  // Create major intersection nodes (galaxy cluster nodes)
  // These represent the densest regions where filaments meet
  const nodeCount = 120;
  for (let i = 0; i < nodeCount; i++) {
    const seed = i * 7777;
    
    // Distribute across ~2 billion light-years (observable universe portion)
    const radius = 1000 * Math.pow(seededRandom(seed), 0.6);
    const theta = seededRandom(seed + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
    
    majorNodes.push({
      position: [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi) * 0.8,
        radius * Math.sin(phi) * Math.sin(theta),
      ],
      brightness: 0.5 + seededRandom(seed + 3) * 0.5,
    });
  }
  
  // Connect nearby nodes with filaments
  for (let i = 0; i < majorNodes.length; i++) {
    const node = majorNodes[i];
    
    // Find 2-4 nearest neighbors
    const distances: { idx: number; dist: number }[] = [];
    for (let j = 0; j < majorNodes.length; j++) {
      if (i === j) continue;
      const other = majorNodes[j];
      const dx = node.position[0] - other.position[0];
      const dy = node.position[1] - other.position[1];
      const dz = node.position[2] - other.position[2];
      distances.push({ idx: j, dist: Math.sqrt(dx * dx + dy * dy + dz * dz) });
    }
    
    distances.sort((a, b) => a.dist - b.dist);
    const connectionCount = 2 + Math.floor(seededRandom(i * 123) * 2);
    
    for (let c = 0; c < connectionCount && c < distances.length; c++) {
      const targetIdx = distances[c].idx;
      
      // Only create filament if this connection hasn't been made yet
      // (avoid duplicates by only connecting to higher indices)
      if (targetIdx > i && distances[c].dist < 600) {
        const target = majorNodes[targetIdx];
        
        // Create curved filament with intermediate nodes
        const filamentNodes: FilamentNode[] = [];
        const segments = 5 + Math.floor(seededRandom(i * 456 + c) * 4);
        
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          
          // Bezier curve with perpendicular offset
          const seed2 = i * 1000 + c * 100 + s;
          const perpOffset = (seededRandom(seed2) - 0.5) * distances[c].dist * 0.15;
          
          const x = node.position[0] + (target.position[0] - node.position[0]) * t + perpOffset * Math.cos(t * Math.PI);
          const y = node.position[1] + (target.position[1] - node.position[1]) * t + perpOffset * 0.3;
          const z = node.position[2] + (target.position[2] - node.position[2]) * t + perpOffset * Math.sin(t * Math.PI);
          
          // Brightness peaks at ends (nodes) and is lower in middle
          const brightness = 0.3 + 0.4 * (1 - Math.abs(t - 0.5) * 2);
          
          filamentNodes.push({ position: [x, y, z], brightness });
        }
        
        filaments.push({
          nodes: filamentNodes,
          width: 30 + seededRandom(i * 789 + c) * 50,
          density: 0.5 + seededRandom(i * 321 + c) * 0.5,
        });
      }
    }
  }
  
  return { filaments, nodes: majorNodes };
};

export const CosmicWeb = ({ visualScale }: CosmicWebProps) => {
  const filamentPointsRef = useRef<THREE.Points>(null);
  const nodePointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  
  // Only visible at Laniakea and Universe scales
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { filamentGeometry, filamentMaterial, nodeGeometry, nodeMaterial } = useMemo(() => {
    const { filaments, nodes } = generateCosmicWeb();
    
    // Generate filament particles
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((filament, fIdx) => {
      // Distribute particles along filament
      filament.nodes.forEach((node, nIdx) => {
        // Add particles around this node
        const particleCount = Math.floor(filament.density * 15);
        
        for (let p = 0; p < particleCount; p++) {
          const seed = fIdx * 10000 + nIdx * 100 + p;
          
          // Scatter around the filament path
          const scatter = filament.width * (seededRandom(seed) - 0.5);
          const scatterY = filament.width * 0.3 * (seededRandom(seed + 1) - 0.5);
          const scatterZ = filament.width * (seededRandom(seed + 2) - 0.5);
          
          filamentPositions.push(
            (node.position[0] + scatter) * mlyScale,
            (node.position[1] + scatterY) * mlyScale,
            (node.position[2] + scatterZ) * mlyScale
          );
          
          // Purple/magenta colors like real cosmic web visualizations
          const hue = 0.78 + seededRandom(seed + 3) * 0.08;
          const sat = 0.5 + seededRandom(seed + 4) * 0.3;
          const light = 0.3 + node.brightness * 0.25;
          
          const color = new THREE.Color().setHSL(hue, sat, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push(0.4 + seededRandom(seed + 5) * 0.4);
        }
      });
    });
    
    // Add extra inter-filament galaxies for cosmic web texture
    const webFillCount = 15000;
    for (let i = 0; i < webFillCount; i++) {
      const seed = i + 200000;
      
      // Large-scale distribution
      const radius = 1200 * Math.pow(seededRandom(seed), 0.5);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      filamentPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * 0.6 * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      const hue = 0.6 + seededRandom(seed + 3) * 0.2;
      const color = new THREE.Color().setHSL(hue, 0.3, 0.25);
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.15 + seededRandom(seed + 4) * 0.2);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Node geometry (bright intersection points)
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeSizes: number[] = [];
    
    nodes.forEach((node, idx) => {
      // Create cluster of particles at each major node
      const particleCount = Math.floor(node.brightness * 80);
      
      for (let p = 0; p < particleCount; p++) {
        const seed = idx * 1000 + p;
        const scatter = 40 * (seededRandom(seed) - 0.5);
        
        nodePositions.push(
          (node.position[0] + scatter) * mlyScale,
          (node.position[1] + scatter * 0.3) * mlyScale,
          (node.position[2] + scatter) * mlyScale
        );
        
        // Orange/yellow for nodes (like galaxy clusters in cosmic web images)
        const hue = 0.08 + seededRandom(seed + 1) * 0.06;
        const sat = 0.7 + seededRandom(seed + 2) * 0.2;
        const light = 0.5 + node.brightness * 0.3;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        nodeColors.push(color.r, color.g, color.b);
        nodeSizes.push(0.6 + seededRandom(seed + 3) * 0.8);
      }
    });
    
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nodeColors), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(nodeSizes), 1));
    nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Texture
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
          gl_PointSize = clamp(pointSize, 0.8, 20.0);
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
      filamentMaterial: createMaterial(300000.0),
      nodeGeometry: nodeGeo,
      nodeMaterial: createMaterial(400000.0),
    };
  }, [mlyScale]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    
    // Fade in at large scales
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 150, mlyScale * 400);
    const fadeOut = 1.0; // Don't fade out - visible at largest scales
    
    const opacity = Math.min(fadeIn, fadeOut) * 0.6;
    
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity * 0.7;
    }
    if (nodePointsRef.current) {
      (nodeMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <>
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