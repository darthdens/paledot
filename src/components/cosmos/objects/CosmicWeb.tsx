import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { UNITS } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface CosmicWebProps {
  visualScale: number;
}

// Cosmic Web - large-scale structure of the universe
// Observable universe: 46.5 Bly radius, ~2 trillion galaxies
// Structure: filaments, walls, nodes (clusters), and voids

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Generate web nodes (cluster intersections)
const generateWebNodes = (count: number, maxRadius: number): THREE.Vector3[] => {
  const nodes: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const seed = i * 7777;
    const r = maxRadius * Math.pow(seededRandom(seed), 0.35);
    const theta = seededRandom(seed + 1) * Math.PI * 2;
    const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
    
    nodes.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.7,
      r * Math.sin(phi) * Math.sin(theta)
    ));
  }
  
  return nodes;
};

// Generate filament connections
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
    const connectionCount = Math.min(4 + Math.floor(seededRandom(i * 123) * 3), nearby.length);
    
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
  const cmbSphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const currentScale = useCosmosStore(state => state.currentScale);
  
  const mlyScale = UNITS.KM_PER_MLY * visualScale;
  const universeRadiusMly = 46500; // 46.5 Bly
  
  const isVisible = currentScale === 'laniakea' || currentScale === 'universe';
  
  const { 
    filamentGeometry, filamentMaterial, 
    nodeGeometry, nodeMaterial, 
    bgGeometry, bgMaterial,
    cmbGeometry, cmbMaterial 
  } = useMemo(() => {
    // Denser web structure
    const nodeCount = 1800;
    const maxRadius = universeRadiusMly;
    const nodes = generateWebNodes(nodeCount, maxRadius);
    const filaments = generateFilaments(nodes, maxRadius * 0.1);
    
    // FILAMENT PARTICLES
    const filamentPositions: number[] = [];
    const filamentColors: number[] = [];
    const filamentSizes: number[] = [];
    
    filaments.forEach((fil, fIdx) => {
      const segmentCount = 25 + Math.floor(seededRandom(fIdx * 111) * 25);
      const filamentWidth = 60 + seededRandom(fIdx * 222) * 100;
      
      for (let s = 0; s <= segmentCount; s++) {
        const t = s / segmentCount;
        
        const seed = fIdx * 1000 + s;
        const curveAmount = fil.from.distanceTo(fil.to) * 0.06;
        const perpX = (seededRandom(seed) - 0.5) * curveAmount;
        const perpZ = (seededRandom(seed + 50) - 0.5) * curveAmount;
        
        const baseX = fil.from.x + (fil.to.x - fil.from.x) * t + perpX * Math.sin(t * Math.PI);
        const baseY = fil.from.y + (fil.to.y - fil.from.y) * t;
        const baseZ = fil.from.z + (fil.to.z - fil.from.z) * t + perpZ * Math.sin(t * Math.PI);
        
        const particlesPerSegment = 6 + Math.floor(fil.strength * 12);
        for (let p = 0; p < particlesPerSegment; p++) {
          const pseed = seed + p * 100;
          
          const r1 = seededRandom(pseed);
          const r2 = seededRandom(pseed + 1);
          const gaussianR = Math.sqrt(-2 * Math.log(r1 + 0.001)) * Math.cos(2 * Math.PI * r2);
          
          const scatter = filamentWidth * gaussianR * 0.35;
          const scatterY = filamentWidth * 0.25 * (seededRandom(pseed + 2) - 0.5);
          const scatterZ = filamentWidth * gaussianR * 0.35;
          
          filamentPositions.push(
            (baseX + scatter) * mlyScale,
            (baseY + scatterY) * mlyScale,
            (baseZ + scatterZ) * mlyScale
          );
          
          const hue = 0.73 + seededRandom(pseed + 3) * 0.15;
          const sat = 0.5 + seededRandom(pseed + 4) * 0.4;
          const light = 0.2 + fil.strength * 0.28 + seededRandom(pseed + 5) * 0.1;
          
          const color = new THREE.Color().setHSL(hue, sat, light);
          filamentColors.push(color.r, color.g, color.b);
          filamentSizes.push((0.2 + fil.strength * 0.5) * (0.4 + seededRandom(pseed + 6) * 0.6));
        }
      }
    });
    
    // Dense diffuse web structure
    const webFillCount = 400000;
    for (let i = 0; i < webFillCount; i++) {
      const seed = i + 200000;
      
      const radius = universeRadiusMly * Math.pow(seededRandom(seed), 0.32);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      filamentPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * 0.55 * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      const hue = 0.55 + seededRandom(seed + 3) * 0.28;
      const light = 0.12 + seededRandom(seed + 4) * 0.1;
      const color = new THREE.Color().setHSL(hue, 0.32, light);
      filamentColors.push(color.r, color.g, color.b);
      filamentSizes.push(0.06 + seededRandom(seed + 5) * 0.12);
    }
    
    const filamentGeo = new THREE.BufferGeometry();
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(filamentPositions), 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(filamentColors), 3));
    filamentGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(filamentSizes), 1));
    filamentGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // NODE PARTICLES (galaxy clusters)
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const nodeSizes: number[] = [];
    
    nodes.forEach((node, idx) => {
      const connectionCount = filaments.filter(f => 
        f.from.equals(node) || f.to.equals(node)
      ).length;
      const brightness = Math.min(0.3 + connectionCount * 0.1, 1.0);
      
      const particleCount = 30 + Math.floor(brightness * 60);
      
      for (let p = 0; p < particleCount; p++) {
        const seed = idx * 1000 + p;
        const scatter = 50 * (seededRandom(seed) - 0.5);
        
        nodePositions.push(
          (node.x + scatter) * mlyScale,
          (node.y + scatter * 0.35) * mlyScale,
          (node.z + scatter) * mlyScale
        );
        
        const hue = 0.04 + seededRandom(seed + 1) * 0.1;
        const sat = 0.7 + seededRandom(seed + 2) * 0.25;
        const light = 0.38 + brightness * 0.35;
        
        const color = new THREE.Color().setHSL(hue, sat, light);
        nodeColors.push(color.r, color.g, color.b);
        nodeSizes.push((0.35 + brightness * 0.9) * (0.45 + seededRandom(seed + 3) * 0.55));
      }
    });
    
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodePositions), 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nodeColors), 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(nodeSizes), 1));
    nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // BACKGROUND GALAXIES
    const bgPositions: number[] = [];
    const bgColors: number[] = [];
    const bgSizes: number[] = [];
    
    const bgCount = 350000;
    for (let i = 0; i < bgCount; i++) {
      const seed = i + 500000;
      
      const radius = universeRadiusMly * Math.pow(seededRandom(seed), 0.28);
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      
      bgPositions.push(
        radius * Math.sin(phi) * Math.cos(theta) * mlyScale,
        radius * Math.cos(phi) * mlyScale,
        radius * Math.sin(phi) * Math.sin(theta) * mlyScale
      );
      
      const distFactor = radius / universeRadiusMly;
      const light = 0.1 * (1 - distFactor * 0.35);
      const color = new THREE.Color().setHSL(0.6, 0.08, light);
      bgColors.push(color.r, color.g, color.b);
      bgSizes.push(0.03 + seededRandom(seed + 3) * 0.06);
    }
    
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bgPositions), 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bgColors), 3));
    bgGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(bgSizes), 1));
    bgGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);
    
    // CMB BOUNDARY SPHERE
    const cmbRadius = universeRadiusMly * mlyScale;
    const cmbGeo = new THREE.SphereGeometry(cmbRadius, 64, 32);
    
    const cmbMat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1.0 },
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
        varying vec3 vPosition;
        varying vec3 vNormal;
        
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
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vec3 noisePos = normalize(vPosition) * 4.0;
          
          float noise = 0.0;
          noise += snoise(noisePos * 1.0) * 0.5;
          noise += snoise(noisePos * 2.0) * 0.25;
          noise += snoise(noisePos * 4.0) * 0.125;
          noise = noise * 0.5 + 0.5;
          
          vec3 coldColor = vec3(0.12, 0.15, 0.22);
          vec3 warmColor = vec3(0.25, 0.18, 0.12);
          vec3 baseColor = vec3(0.18, 0.16, 0.14);
          
          vec3 cmbColor = mix(coldColor, warmColor, noise);
          cmbColor = mix(baseColor, cmbColor, 0.45);
          
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float edgeGlow = 0.25 + fresnel * 0.45;
          
          gl_FragColor = vec4(cmbColor * edgeGlow, uOpacity * 0.4);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    
    // Shared texture
    const texSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(texSize / 2, texSize / 2, 0, texSize / 2, texSize / 2, texSize / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
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
          gl_PointSize = clamp(pointSize, 0.4, 22.0);
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
      filamentMaterial: createMaterial(1100000.0),
      nodeGeometry: nodeGeo,
      nodeMaterial: createMaterial(1600000.0),
      bgGeometry: bgGeo,
      bgMaterial: createMaterial(700000.0),
      cmbGeometry: cmbGeo,
      cmbMaterial: cmbMat,
    };
  }, [mlyScale, universeRadiusMly]);
  
  useFrame(() => {
    if (!isVisible) return;
    
    const distance = camera.position.length();
    const fadeIn = THREE.MathUtils.smoothstep(distance, mlyScale * 150, mlyScale * 500);
    
    const filamentOpacity = fadeIn * 0.75;
    const nodeOpacity = fadeIn * 0.9;
    const bgOpacity = fadeIn * 0.55;
    const cmbOpacity = fadeIn;
    
    if (filamentPointsRef.current) {
      (filamentMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = filamentOpacity;
    }
    if (nodePointsRef.current) {
      (nodeMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = nodeOpacity;
    }
    if (backgroundRef.current) {
      (bgMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = bgOpacity;
    }
    if (cmbSphereRef.current) {
      (cmbMaterial as THREE.ShaderMaterial).uniforms.uOpacity.value = cmbOpacity;
    }
  });
  
  if (!isVisible) return null;
  
  return (
    <>
      <mesh ref={cmbSphereRef} geometry={cmbGeometry} material={cmbMaterial} />
      <points ref={backgroundRef} geometry={bgGeometry} material={bgMaterial} frustumCulled={false} />
      <points ref={filamentPointsRef} geometry={filamentGeometry} material={filamentMaterial} frustumCulled={false} />
      <points ref={nodePointsRef} geometry={nodeGeometry} material={nodeMaterial} frustumCulled={false} />
    </>
  );
};