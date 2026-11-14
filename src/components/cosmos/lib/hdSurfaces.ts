// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';

/**
 * Sharper NASA global maps, swapped in after boot once the camera comes near the body
 * (the bundled 1–2k maps stay for the loader). Sources are listed in CREDITS.md.
 */
const HD: Record<string, { primary: string; secondary?: string }> = {
  earth: { primary: 'earth-day', secondary: 'earth-night' },
  moon: { primary: 'moon' },
  mars: { primary: 'mars' },
};
const NEAR_RADII = 60;
const cache = new Map<string, Promise<THREE.Texture>>();

export function hasHdSurface(id: string) { return id in HD; }

function load(name: string, gl: THREE.WebGLRenderer) {
  const width = gl.capabilities.maxTextureSize >= 8192 && !/Mobi|Android|iPhone|iPad/.test(navigator.userAgent) ? 8192 : 4096;
  const url = `/textures/hd/${name}-${width}.webp`;
  let p = cache.get(url);
  if (!p) {
    p = new THREE.TextureLoader().loadAsync(url).then(tex => {
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = gl.capabilities.getMaxAnisotropy();
      return tex;
    });
    cache.set(url, p);
  }
  return p;
}

/** Call each frame; resolves once per body when the camera is within NEAR_RADII radii. */
export function maybeUpgradeSurface(id: string, state: { requested: boolean }, cameraDistance: number, radius: number,
  gl: THREE.WebGLRenderer, material: THREE.ShaderMaterial) {
  const spec = HD[id];
  if (!spec || state.requested || cameraDistance > radius * NEAR_RADII) return;
  state.requested = true;
  const apply = (key: 'planetMap' | 'planetMapSecondary') => (tex: THREE.Texture) => {
    const u = material.uniforms[key]; if (!u) return;
    const old = u.value as THREE.Texture | null; u.value = tex; tex.needsUpdate = true; void old;
  };
  load(spec.primary, gl).then(apply('planetMap')).catch(() => { state.requested = false; });
  if (spec.secondary) load(spec.secondary, gl).then(apply('planetMapSecondary')).catch(() => {});
}
