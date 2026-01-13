import { useMemo } from 'react';
import * as THREE from 'three';
import { UNITS } from '../types';

interface LocalGroupDwarfGalaxiesProps {
  visualScale: number;
}

// Dwarf galaxy types for visual variety
type DwarfType = 'irregular' | 'elliptical' | 'spheroidal';

interface DwarfGalaxy {
  position: [number, number, number];
  type: DwarfType;
  color: THREE.Color;
  brightness: number;
  sizePx: number; // screen-space size
}

// Generate ~80 realistic Local Group dwarf galaxies
// Real Local Group spans roughly 10 million light-years
const generateDwarfGalaxies = (gs: number): DwarfGalaxy[] => {
  const galaxies: DwarfGalaxy[] = [];
  const targetCount = 82;

  // Seeded random for consistency
  const rnd = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  // Local Group bounds in light-years (radius ~5 Mly => ~10 Mly across)
  const localGroupRadiusLy = 5e6;

  const irregularColors = [
    new THREE.Color('#8ecae6'),
    new THREE.Color('#a0d2db'),
    new THREE.Color('#bee3db'),
  ];

  const ellipticalColors = [
    new THREE.Color('#ffd6a5'),
    new THREE.Color('#ffb88c'),
    new THREE.Color('#f9c74f'),
  ];

  const spheroidalColors = [
    new THREE.Color('#e6ccb2'),
    new THREE.Color('#ddb892'),
    new THREE.Color('#b08968'),
  ];

  // We generate a few extra candidates then take the first N that pass constraints
  for (let i = 0; i < 2000 && galaxies.length < targetCount; i++) {
    const seed = (i + 1) * 12345.6789;

    // Spherical distribution
    const u = rnd(seed);
    const v = rnd(seed + 1);
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    // Exponential falloff (cluster toward center)
    const radialU = rnd(seed + 2);
    const distanceLy = localGroupRadiusLy * Math.pow(radialU, 0.42) * 0.95;

    // Slight flattening
    const flattenFactor = 0.7;

    const xLy = distanceLy * Math.sin(phi) * Math.cos(theta);
    const yLy = distanceLy * Math.cos(phi) * flattenFactor;
    const zLy = distanceLy * Math.sin(phi) * Math.sin(theta);

    // Keep a "clear" area around Milky Way core (50k ly)
    const distFromOriginLy = Math.sqrt(xLy * xLy + yLy * yLy + zLy * zLy);
    if (distFromOriginLy < 50000) continue;

    // Type distribution: 40% irregular, 25% elliptical, 35% spheroidal
    const typeRand = rnd(seed + 4);
    let type: DwarfType;
    let palette: THREE.Color[];

    if (typeRand < 0.4) {
      type = 'irregular';
      palette = irregularColors;
    } else if (typeRand < 0.65) {
      type = 'elliptical';
      palette = ellipticalColors;
    } else {
      type = 'spheroidal';
      palette = spheroidalColors;
    }

    const colorIndex = Math.floor(rnd(seed + 5) * palette.length);
    const color = palette[colorIndex].clone();

    // Subtle per-galaxy tint variance
    color.r = THREE.MathUtils.clamp(color.r + (rnd(seed + 6) - 0.5) * 0.12, 0, 1);
    color.g = THREE.MathUtils.clamp(color.g + (rnd(seed + 7) - 0.5) * 0.12, 0, 1);
    color.b = THREE.MathUtils.clamp(color.b + (rnd(seed + 8) - 0.5) * 0.12, 0, 1);

    const brightness = 0.55 + rnd(seed + 9) * 0.65;

    // Screen-space size (keeps them visible at all cosmic scales)
    let sizePx = 10 + rnd(seed + 10) * 18; // 10..28px
    if (type === 'spheroidal') sizePx *= 0.85;
    if (type === 'irregular') sizePx *= 1.1;

    galaxies.push({
      position: [xLy * gs, yLy * gs, zLy * gs],
      type,
      color,
      brightness,
      sizePx,
    });
  }

  return galaxies;
};

export const LocalGroupDwarfGalaxies = ({ visualScale }: LocalGroupDwarfGalaxiesProps) => {
  const gs = UNITS.KM_PER_LY * visualScale;

  const { geometry, material } = useMemo(() => {
    const dwarfs = generateDwarfGalaxies(gs);

    const positions = new Float32Array(dwarfs.length * 3);
    const colors = new Float32Array(dwarfs.length * 3);
    const sizes = new Float32Array(dwarfs.length);

    dwarfs.forEach((g, i) => {
      positions[i * 3] = g.position[0];
      positions[i * 3 + 1] = g.position[1];
      positions[i * 3 + 2] = g.position[2];

      colors[i * 3] = g.color.r * g.brightness;
      colors[i * 3 + 1] = g.color.g * g.brightness;
      colors[i * 3 + 2] = g.color.b * g.brightness;

      sizes[i] = g.sizePx;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    // Soft sprite texture (canvas)
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * tex;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, material };
  }, [gs]);

  return (
    <points geometry={geometry} material={material} frustumCulled={false} />
  );
};
