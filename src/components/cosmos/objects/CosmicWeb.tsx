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
// Structure resembles a sponge or neural network
// Filaments: 150-500 Mly long, 30-100 Mly wide
// Voids: 100-400 Mly diameter, occupy ~80% of volume

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate hierarchical web nodes at multiple scales
const generateWebNodes = (count: number, maxRadius: number): THREE.Vector3[] => {
  const nodes: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = i * 7777;
    
    // More uniform distribution across full sphere
    const r = maxRadius * Math.cbrt(seededRandom(seed)); // Cube root for volume-uniform
    const theta = seededRandom(seed + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
    
    nodes.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.85, // Slight flattening
      r * Math.sin(phi) * Math.sin(theta)
    ));
  }
  
  return nodes;
};

// Build Delaunay-like connections for cosmic web
const generateFilaments = (nodes: THREE.Vector3[], maxConnectionDist: number) => {
  const connections: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    const nearby: { idx: number; dist: number }[] = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = node.distanceTo(nodes[j]);
      if (dist < maxConnectionDist && dist > maxConnectionDist * 0.02) {
        nearby.push({ idx: j, dist });
      }
    }
    
    nearby.sort((a, b) => a.dist - b.dist);
    // Connect to 4-8 neighbors for dense web
    const connectionCount = Math.min(4 + Math.floor(seededRandom(i * 123) * 4), nearby.length);
    
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
  const cmbSphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  // Observable universe radius: 46,500 Mly (46.5 Bly)
  const universeRadiusMly = 46500;
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { 
    filamentGeometry, filamentMaterial, 
    nodeGeometry, nodeMaterial, 
    cmbGeometry, cmbMaterial 
  } = useMemo(() => {
    // Dense web structure - many nodes across the entire universe
    const nodeCount = 3000;
    const maxRadius = universeRadiusMly * 0.98; // Almost to the CMB edge
    const nodes = generateWebNodes(nodeCount, maxRadius);
    const filaments = generateFilaments(nodes, maxRadius * 0.08);
    
    // === FILAMENT PARTICLES - THE MAIN VISUAL ===
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      const filLength = fil.from.distanceTo(fil.to);
      // More segments for longer filaments
      const segmentCount = Math.floor(15 + filLength / 500);
      const filamentWidth = 150 + seededRandom(fIdx * 222) * 250; // Wider filaments
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        
        const seed = fIdx * 1000 + s;
        const curveAmount = filLength * 0.1;
        const perpX = (seededRandom(seed) - 0.5) * curveAmount;
        const perpZ = (seededRandom(seed + 50) - 0.5) * curveAmount;
        
        // Curved filament path
        const curveT = Math.sin(t * Math.PI);
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t + perpX * curveT;
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t + perpZ * curveT;
        
        // Dense particles along filament core
        const particlesPerSegment = 8 + Math.floor(fil.strength * 15);
        for (let p = 0; p < particlesPerSegment; p++) {
          const pseed = seed + p * 100;
          
          // Gaussian distribution for realistic filament cross-section
          const r1 = seededRandom(pseed);
          const r2 = seededRandom(pseed + 1);
          const gaussianR = Math.sqrt(-2 * Math.log(Math.max(r1, 0.001))) * Math.cos(2 * Math.PI * r2);
          
          const scatter = filamentWidth * gaussianR * 0.35;
          const scatterY = filamentWidth * 0.25 * (seededRandom(pseed + 2) - 0.5) * gaussianR;
          const scatterZ = filamentWidth * gaussianR * 0.35 * (seededRandom(pseed + 7) - 0.5) * 2;
          
          filamentPositions.push(
            (baseX + scatter) * mlyScale,
            (baseY + scatterY) * mlyScale,
            (baseZ + scatterZ) * mlyScale
          );
          
          // Purple/blue/magenta gradient like Illustris/Millennium simulations
          const hue = 0.68 + seededRandom(pseed + 3) * 0.18; // 0.68-0.86 (blue to magenta)
          const sat = 0.45 + seededRandom(pseed + 4) * 0.35;
          const light = 0.2 + fil.strength * 0.35 + seededRandom(pseed + 5) * 0.1;
          
          const color = new THREE.Color().setHSL(hue, sat, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push((0.3 + fil.strength * 0.7) * (0.6 + seededRandom(pseed + 6) * 0.4));
        }
      }
    });
    
    // Additional fine filaments to fill gaps - distributed across entire volume
    const fineFilamentCount = 600000;
    for (let i = 0; i < fineFilamentCount; i++) {
      const seed = i + 300000;
      
      // Volume-uniform distribution
      const radius = universeRadiusMly * 0.95 * Math.cbrt(seededRandom(seed));
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      filamentPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * 0.85 * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      // Consistent purple/blue colors
      const hue = 0.62 + seededRandom(seed + 3) * 0.22;
      const sat = 0.35 + seededRandom(seed + 8) * 0.25;
      const light = 0.18 + seededRandom(seed + 4) * 0.18;
      const color = new THREE.Color().setHSL(hue, sat, light);
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.12 + seededRandom(seed + 5) * 0.2);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // === NODE PARTICLES (galaxy clusters/superclusters at intersections) ===
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeSizes: number[] = [];
    
    nodes.forEach((node, idx) => {
      // Count connections for brightness
      const connectionCount = filaments.filter(f => 
        f.from.equals(node) || f.to.equals(node)
      ).length;
      const brightness = Math.min(0.35 + connectionCount * 0.08, 1.0);
      
      // More particles per node for visible clusters
      const particleCount = 20 + Math.floor(brightness * 40);
      
      for (let p = 0; p < particleCount; p++) {
        const seed = idx * 1000 + p;
        const scatter = 100 * (seededRandom(seed) - 0.5);
        
        nodePositions.push(
          (node.x + scatter) * mlyScale,
          (node.y + scatter * 0.5) * mlyScale,
          (node.z + scatter) * mlyScale
        );
        
        // Warmer orange/yellow for dense cluster nodes
        const hue = 0.05 + seededRandom(seed + 1) * 0.12;
        const sat = 0.65 + seededRandom(seed + 2) * 0.3;
        const light = 0.4 + brightness * 0.35;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        nodeColors.push(color.r, color.g, color.b);
        nodeSizes.push((0.5 + brightness * 1.0) * (0.5 + seededRandom(seed + 3) * 0.5));
      }
    });
    
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nodeColors), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(nodeSizes), 1));
    nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // === CMB BOUNDARY SPHERE ===
    // The Cosmic Microwave Background - colorful like Planck/WMAP data
    const cmbRadius = universeRadiusMly * mlyScale;
    const cmbGeo = new THREE.SphereGeometry(cmbRadius, 128, 64);
    
    // CMB shader matching the colorful temperature map visualization
    const cmbMat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1.0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Simplex noise for CMB fluctuations
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        // Colorful CMB temperature map (like Planck data visualization)
        vec3 cmbColorMap(float t) {
          // Multi-stop gradient: blue -> cyan -> green -> yellow -> orange -> red
          vec3 blue = vec3(0.1, 0.1, 0.6);
          vec3 cyan = vec3(0.0, 0.6, 0.7);
          vec3 green = vec3(0.2, 0.8, 0.3);
          vec3 yellow = vec3(0.9, 0.9, 0.2);
          vec3 orange = vec3(1.0, 0.5, 0.1);
          vec3 red = vec3(0.7, 0.1, 0.2);
          
          if (t < 0.2) return mix(blue, cyan, t / 0.2);
          else if (t < 0.4) return mix(cyan, green, (t - 0.2) / 0.2);
          else if (t < 0.6) return mix(green, yellow, (t - 0.4) / 0.2);
          else if (t < 0.8) return mix(yellow, orange, (t - 0.6) / 0.2);
          else return mix(orange, red, (t - 0.8) / 0.2);
        }
        
        void main() {
          // Normalize position for noise sampling
          vec3 noisePos = normalize(vPosition) * 4.0;
          
          // Multi-octave noise for CMB anisotropies
          float noise = 0.0;
          noise += snoise(noisePos * 1.0) * 0.5;
          noise += snoise(noisePos * 2.0) * 0.25;
          noise += snoise(noisePos * 4.0) * 0.125;
          noise += snoise(noisePos * 8.0) * 0.0625;
          noise += snoise(noisePos * 16.0) * 0.03125;
          noise = noise * 0.5 + 0.5; // Normalize to 0-1
          
          // Apply the colorful CMB temperature map
          vec3 cmbColor = cmbColorMap(noise);
          
          // Slight brightness variation
          cmbColor *= 0.8 + noise * 0.4;
          
          // Fresnel edge glow
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 1.5);
          float edgeGlow = 0.85 + fresnel * 0.3;
          
          gl_FragColor = vec4(cmbColor * edgeGlow, uOpacity * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
    });
    
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
      cmbGeometry: cmbGeo,
      cmbMaterial: cmbMat,
    };
  }, [mlyScale, universeRadiusMly]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    
    // Fade in at large scales
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 200, mlyScale * 600);
    
    const filamentOpacity = fadeIn * 0.75;
    const nodeOpacity = fadeIn * 0.85;
    const cmbOpacity = fadeIn;
    
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = filamentOpacity;
    }
    if (nodePointsRef.current) {
      (nodeMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = nodeOpacity;
    }
    if (cmbSphereRef.current) {
      (cmbMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = cmbOpacity;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <group>
      {/* Filaments - the main web structure */}
      <points ref={filamentPointsRef} geometry={filamentGeometry} material={filamentMaterial} frustumCulled={false} />
      
      {/* Nodes - galaxy clusters at intersections */}
      <points ref={nodePointsRef} geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} />
      
      {/* CMB boundary sphere */}
      <mesh ref={cmbSphereRef} geometry={cmbGeometry} material={cmbMaterial} frustumCulled={false} />
    </group>
  );
};
