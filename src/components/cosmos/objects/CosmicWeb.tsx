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
// Contains ~2 trillion galaxies arranged in filaments, walls, and clusters
// Filaments naturally define the structure - no artificial boundary needed

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate hierarchical web nodes at multiple scales
const generateWebNodes = (count: number, maxRadius: number): THREE.Vector3[] => {
  const nodes: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = i * 7777;
    
    // Volume-uniform distribution across full sphere
    const r = maxRadius * Math.cbrt(seededRandom(seed));
    const theta = seededRandom(seed + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
    
    nodes.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.9,
      r * Math.sin(phi) * Math.sin(theta)
    ));
  }
  
  return nodes;
};

// Build connections for cosmic web
const generateFilaments = (nodes: THREE.Vector3[], maxConnectionDist: number) => {
  const connections: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    const nearby: { idx: number; dist: number }[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = node.distanceTo(nodes[j]);
      if (dist < maxConnectionDist && dist > maxConnectionDist * 0.015) {
        nearby.push({ idx: j, dist });
      }
    }
    
    nearby.sort((a, b) => a.dist - b.dist);
    // Connect to 5-10 neighbors for very dense web
    const connectionCount = Math.min(5 + Math.floor(seededRandom(i * 123) * 5), nearby.length);
    
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
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  // Observable universe radius: 46,500 Mly (46.5 Bly)
  const universeRadiusMly = 46500;
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { 
    filamentGeometry, filamentMaterial, 
    nodeGeometry, nodeMaterial
  } = useMemo(() => {
    // Many more nodes = many more filament connections
    const nodeCount = 12000;
    const maxRadius = universeRadiusMly;
    const nodes = generateWebNodes(nodeCount, maxRadius);
    // Larger connection distance = more filaments spanning the space
    const filaments = generateFilaments(nodes, maxRadius * 0.1);
    
    // === FILAMENT PARTICLES ===
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      const filLength = fil.from.distanceTo(fil.to);
      // Fewer particles per filament, but we have many more filaments
      const segmentCount = Math.floor(12 + filLength / 600);
      const filamentWidth = 120 + seededRandom(fIdx * 222) * 180;
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        
        const seed = fIdx * 1000 + s;
        const curveAmount = filLength * 0.08;
        const perpX = (seededRandom(seed) - 0.5) * curveAmount;
        const perpZ = (seededRandom(seed + 50) - 0.5) * curveAmount;
        
        // Curved filament path
        const curveT = Math.sin(t * Math.PI);
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t + perpX * curveT;
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t + perpZ * curveT;
        
        // Just a few particles per segment - the structure comes from many filaments
        const particlesPerSegment = 3 + Math.floor(fil.strength * 4);
        for (let p = 0; p < particlesPerSegment; p++) {
          const pseed = seed + p * 100;
          
          const scatter = filamentWidth * (seededRandom(pseed) - 0.5) * 0.5;
          const scatterY = filamentWidth * 0.15 * (seededRandom(pseed + 2) - 0.5);
          const scatterZ = filamentWidth * (seededRandom(pseed + 7) - 0.5) * 0.5;
          
          filamentPositions.push(
            (baseX + scatter) * mlyScale,
            (baseY + scatterY) * mlyScale,
            (baseZ + scatterZ) * mlyScale
          );
          
          // Purple/blue/magenta gradient
          const hue = 0.65 + seededRandom(pseed + 3) * 0.2;
          const sat = 0.45 + seededRandom(pseed + 4) * 0.35;
          const light = 0.22 + fil.strength * 0.3 + seededRandom(pseed + 5) * 0.1;
          
          const color = new THREE.Color().setHSL(hue, sat, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push((0.3 + fil.strength * 0.5) * (0.7 + seededRandom(pseed + 6) * 0.3));
        }
      }
    });
    
    // Light background fill - just to soften gaps, not the main structure
    const bgFillCount = 150000;
    for (let i = 0; i < bgFillCount; i++) {
      const seed = i + 500000;
      
      const radius = universeRadiusMly * Math.cbrt(seededRandom(seed));
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      filamentPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * 0.9 * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      const distFactor = radius / universeRadiusMly;
      const edgeFade = 1 - Math.pow(distFactor, 4);
      
      const hue = 0.6 + seededRandom(seed + 3) * 0.22;
      const light = (0.12 + seededRandom(seed + 4) * 0.1) * edgeFade;
      const color = new THREE.Color().setHSL(hue, 0.3, Math.max(light, 0.03));
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.08 + seededRandom(seed + 5) * 0.1);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // === NODE PARTICLES (galaxy clusters at intersections) ===
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeSizes: number[] = [];
    
    nodes.forEach((node, idx) => {
      const connectionCount = filaments.filter(f => 
        f.from.equals(node) || f.to.equals(node)
      ).length;
      const brightness = Math.min(0.3 + connectionCount * 0.06, 1.0);
      
      // Distance fade for natural boundary
      const nodeDist = node.length();
      const edgeFade = 1 - Math.pow(nodeDist / universeRadiusMly, 4);
      
      const particleCount = Math.floor((15 + brightness * 35) * edgeFade);
      
      for (let p = 0; p < particleCount; p++) {
        const seed = idx * 1000 + p;
        const scatter = 120 * (seededRandom(seed) - 0.5);
        
        nodePositions.push(
          (node.x + scatter) * mlyScale,
          (node.y + scatter * 0.5) * mlyScale,
          (node.z + scatter) * mlyScale
        );
        
        // Warmer orange/yellow for dense cluster nodes
        const hue = 0.05 + seededRandom(seed + 1) * 0.12;
        const sat = 0.6 + seededRandom(seed + 2) * 0.3;
        const light = (0.35 + brightness * 0.35) * edgeFade;
        
        const color = new THREE.Color().setHSL(hue, sat, Math.max(light, 0.1));
        nodeColors.push(color.r, color.g, color.b);
        nodeSizes.push((0.45 + brightness * 0.9) * (0.5 + seededRandom(seed + 3) * 0.5) * edgeFade);
      }
    });
    
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nodeColors), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(nodeSizes), 1));
    nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // Shared point texture - softer glow
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
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
          gl_PointSize = clamp(pointSize, 0.5, 25.0);
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
      filamentMaterial: createMaterial(1200000.0),
      nodeGeometry: nodeGeo,
      nodeMaterial: createMaterial(1600000.0),
    };
  }, [mlyScale, universeRadiusMly]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    
    // Fade in at large scales
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 200, mlyScale * 600);
    
    const filamentOpacity = fadeIn * 0.8;
    const nodeOpacity = fadeIn * 0.85;
    
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = filamentOpacity;
    }
    if (nodePointsRef.current) {
      (nodeMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = nodeOpacity;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group>
      {/* Filaments - the main web structure filling the observable universe */}
      <points ref={filamentPointsRef} geometry={filamentGeometry} material={filamentMaterial} frustumCulled={false} />
      
      {/* Nodes - galaxy clusters at intersections */}
      <points ref={nodePointsRef} geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} />
    </group>
  );
};
