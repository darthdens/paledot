import * as THREE from 'three';

/**
 * Shared texture singletons for all galaxy components.
 * This eliminates redundant canvas/texture creation across galaxies.
 */

let _dotTexture: THREE.CanvasTexture | null = null;
let _milkyWayGlowTexture: THREE.CanvasTexture | null = null;
let _andromedaGlowTexture: THREE.CanvasTexture | null = null;
let _triangulumGlowTexture: THREE.CanvasTexture | null = null;
let _whirlpoolGlowTexture: THREE.CanvasTexture | null = null;
let _companionGlowTexture: THREE.CanvasTexture | null = null;
let _sombreroGlowTexture: THREE.CanvasTexture | null = null;

/**
 * Simple crisp dot texture for stars - shared across all galaxies
 */
export const getDotTexture = (): THREE.CanvasTexture => {
  if (_dotTexture) return _dotTexture;

  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.75)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _dotTexture = new THREE.CanvasTexture(canvas);
  _dotTexture.minFilter = THREE.LinearFilter;
  _dotTexture.magFilter = THREE.LinearFilter;
  _dotTexture.colorSpace = THREE.SRGBColorSpace;
  return _dotTexture;
};

/**
 * Milky Way galaxy glow texture: yellow (center) → orange → purple → blue → fade
 */
export const getMilkyWayGlowTexture = (): THREE.CanvasTexture => {
  if (_milkyWayGlowTexture) return _milkyWayGlowTexture;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 220, 80, 0.9)');
  gradient.addColorStop(0.12, 'rgba(255, 180, 40, 0.7)');
  gradient.addColorStop(0.25, 'rgba(255, 120, 30, 0.5)');
  gradient.addColorStop(0.4, 'rgba(200, 80, 140, 0.35)');
  gradient.addColorStop(0.55, 'rgba(140, 70, 200, 0.25)');
  gradient.addColorStop(0.7, 'rgba(80, 100, 220, 0.15)');
  gradient.addColorStop(0.85, 'rgba(50, 80, 180, 0.08)');
  gradient.addColorStop(1, 'rgba(30, 50, 150, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _milkyWayGlowTexture = new THREE.CanvasTexture(canvas);
  _milkyWayGlowTexture.minFilter = THREE.LinearFilter;
  _milkyWayGlowTexture.magFilter = THREE.LinearFilter;
  _milkyWayGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _milkyWayGlowTexture;
};

/**
 * Andromeda galaxy glow texture: white/blue center → orange dust ring → blue outer haze
 */
export const getAndromedaGlowTexture = (): THREE.CanvasTexture => {
  if (_andromedaGlowTexture) return _andromedaGlowTexture;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.08, 'rgba(200, 220, 255, 0.85)');
  gradient.addColorStop(0.15, 'rgba(150, 180, 255, 0.7)');
  gradient.addColorStop(0.25, 'rgba(100, 150, 255, 0.5)');
  gradient.addColorStop(0.35, 'rgba(255, 180, 80, 0.4)');
  gradient.addColorStop(0.45, 'rgba(255, 200, 100, 0.35)');
  gradient.addColorStop(0.55, 'rgba(180, 140, 100, 0.25)');
  gradient.addColorStop(0.7, 'rgba(80, 120, 200, 0.15)');
  gradient.addColorStop(0.85, 'rgba(60, 100, 180, 0.08)');
  gradient.addColorStop(1, 'rgba(40, 80, 160, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _andromedaGlowTexture = new THREE.CanvasTexture(canvas);
  _andromedaGlowTexture.minFilter = THREE.LinearFilter;
  _andromedaGlowTexture.magFilter = THREE.LinearFilter;
  _andromedaGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _andromedaGlowTexture;
};

/**
 * Triangulum galaxy glow texture: white-blue center with pink/magenta tones
 */
export const getTriangulumGlowTexture = (): THREE.CanvasTexture => {
  if (_triangulumGlowTexture) return _triangulumGlowTexture;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.08, 'rgba(200, 220, 255, 0.85)');
  gradient.addColorStop(0.15, 'rgba(150, 180, 255, 0.65)');
  gradient.addColorStop(0.25, 'rgba(100, 150, 255, 0.45)');
  gradient.addColorStop(0.35, 'rgba(255, 150, 200, 0.35)');
  gradient.addColorStop(0.45, 'rgba(200, 120, 180, 0.28)');
  gradient.addColorStop(0.55, 'rgba(150, 100, 200, 0.2)');
  gradient.addColorStop(0.7, 'rgba(80, 120, 200, 0.12)');
  gradient.addColorStop(0.85, 'rgba(60, 100, 180, 0.06)');
  gradient.addColorStop(1, 'rgba(40, 80, 160, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _triangulumGlowTexture = new THREE.CanvasTexture(canvas);
  _triangulumGlowTexture.minFilter = THREE.LinearFilter;
  _triangulumGlowTexture.magFilter = THREE.LinearFilter;
  _triangulumGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _triangulumGlowTexture;
};

/**
 * Whirlpool galaxy glow texture: warm cream core → pink HII → blue outer
 */
export const getWhirlpoolGlowTexture = (): THREE.CanvasTexture => {
  if (_whirlpoolGlowTexture) return _whirlpoolGlowTexture;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
  gradient.addColorStop(0.06, 'rgba(255, 235, 180, 0.88)');
  gradient.addColorStop(0.12, 'rgba(255, 220, 150, 0.75)');
  gradient.addColorStop(0.20, 'rgba(220, 200, 160, 0.55)');
  gradient.addColorStop(0.30, 'rgba(255, 150, 180, 0.42)');
  gradient.addColorStop(0.42, 'rgba(200, 120, 160, 0.32)');
  gradient.addColorStop(0.55, 'rgba(140, 160, 200, 0.22)');
  gradient.addColorStop(0.70, 'rgba(100, 140, 190, 0.14)');
  gradient.addColorStop(0.85, 'rgba(80, 120, 170, 0.07)');
  gradient.addColorStop(1, 'rgba(60, 100, 150, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _whirlpoolGlowTexture = new THREE.CanvasTexture(canvas);
  _whirlpoolGlowTexture.minFilter = THREE.LinearFilter;
  _whirlpoolGlowTexture.magFilter = THREE.LinearFilter;
  _whirlpoolGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _whirlpoolGlowTexture;
};

/**
 * Companion galaxy glow texture: warm yellow-orange (older stars)
 */
export const getCompanionGlowTexture = (): THREE.CanvasTexture => {
  if (_companionGlowTexture) return _companionGlowTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
  gradient.addColorStop(0.15, 'rgba(255, 220, 160, 0.75)');
  gradient.addColorStop(0.35, 'rgba(240, 180, 120, 0.50)');
  gradient.addColorStop(0.55, 'rgba(200, 150, 100, 0.30)');
  gradient.addColorStop(0.75, 'rgba(150, 120, 90, 0.15)');
  gradient.addColorStop(1, 'rgba(100, 80, 60, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  _companionGlowTexture = new THREE.CanvasTexture(canvas);
  _companionGlowTexture.minFilter = THREE.LinearFilter;
  _companionGlowTexture.magFilter = THREE.LinearFilter;
  _companionGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _companionGlowTexture;
};

/**
 * Sombrero galaxy glow texture: smooth cream/golden glow
 */
export const getSombreroGlowTexture = (): THREE.CanvasTexture => {
  if (_sombreroGlowTexture) return _sombreroGlowTexture;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const centerX = size / 2;
  const centerY = size / 2;

  ctx.clearRect(0, 0, size, size);

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
  gradient.addColorStop(0, 'rgba(255, 252, 245, 0.85)');
  gradient.addColorStop(0.1, 'rgba(255, 248, 235, 0.7)');
  gradient.addColorStop(0.25, 'rgba(255, 240, 215, 0.5)');
  gradient.addColorStop(0.4, 'rgba(255, 225, 190, 0.32)');
  gradient.addColorStop(0.55, 'rgba(250, 210, 165, 0.18)');
  gradient.addColorStop(0.7, 'rgba(240, 195, 145, 0.1)');
  gradient.addColorStop(0.85, 'rgba(225, 175, 125, 0.04)');
  gradient.addColorStop(1, 'rgba(210, 160, 115, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.fill();

  _sombreroGlowTexture = new THREE.CanvasTexture(canvas);
  _sombreroGlowTexture.minFilter = THREE.LinearFilter;
  _sombreroGlowTexture.magFilter = THREE.LinearFilter;
  _sombreroGlowTexture.colorSpace = THREE.SRGBColorSpace;
  return _sombreroGlowTexture;
};

/**
 * Cleanup function to dispose of all textures when needed
 */
export const disposeSharedTextures = () => {
  _dotTexture?.dispose();
  _milkyWayGlowTexture?.dispose();
  _andromedaGlowTexture?.dispose();
  _triangulumGlowTexture?.dispose();
  _whirlpoolGlowTexture?.dispose();
  _companionGlowTexture?.dispose();
  _sombreroGlowTexture?.dispose();

  _dotTexture = null;
  _milkyWayGlowTexture = null;
  _andromedaGlowTexture = null;
  _triangulumGlowTexture = null;
  _whirlpoolGlowTexture = null;
  _companionGlowTexture = null;
  _sombreroGlowTexture = null;
};
