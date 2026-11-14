// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import * as THREE from 'three';

/**
 * Sharper NASA global maps, downloaded behind the opening loader (preloadHdSurfaces) and applied
 * and uploaded to the GPU at once, so approaching a body never stalls. Sources are listed in CREDITS.md.
 */
const HD: Record<string, { primary: string; secondary?: string }> = {
  earth: { primary: 'earth-day', secondary: 'earth-night' },
  moon: { primary: 'moon' },
  mars: { primary: 'mars' },
};
const NEAR_RADII = 60;
const cache = new Map<string, Promise<THREE.Texture>>();

export function hasHdSurface(id: string) { return id in HD; }

function pickWidth(maxTextureSize: number) {
  return maxTextureSize >= 8192 && !/Mobi|Android|iPhone|iPad/.test(navigator.userAgent) ? 8192 : 4096;
}
function load(name: string, gl: THREE.WebGLRenderer, maxTex = gl.capabilities.maxTextureSize, aniso = gl.capabilities.getMaxAnisotropy()) {
  const width = pickWidth(maxTex);
  const url = `/textures/hd/${name}-${width}.webp`;
  let p = cache.get(url);
  if (!p) {
    p = new THREE.TextureLoader().loadAsync(url).then(tex => {
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
      return tex;
    });
    cache.set(url, p);
  }
  return p;
}

/** Opening load: download every HD map (same cache and size choice as load()). Failures don't block. */
export function preloadHdSurfaces(): Promise<void> {
  let maxTex = 4096;
  try { const c = document.createElement('canvas').getContext('webgl'); if (c) maxTex = c.getParameter(c.MAX_TEXTURE_SIZE) as number; } catch { /* keep 4096 */ }
  const fake = { capabilities: { maxTextureSize: maxTex, getMaxAnisotropy: () => 8 } } as unknown as THREE.WebGLRenderer;
  const names = Object.values(HD).flatMap(s => [s.primary, ...(s.secondary ? [s.secondary] : [])]);
  return Promise.allSettled(names.map(n => load(n, fake, maxTex, 8))).then(() => undefined);
}

/** Call each frame; applies each body's HD maps once (immediately; they are preloaded at boot). */
export function maybeUpgradeSurface(id: string, state: { requested: boolean }, cameraDistance: number, radius: number,
  gl: THREE.WebGLRenderer, material: THREE.ShaderMaterial) {
  const spec = HD[id];
  if (!spec || state.requested) return;
  void cameraDistance; void radius; void NEAR_RADII;
  state.requested = true;
  const apply = (key: 'planetMap' | 'planetMapSecondary') => (tex: THREE.Texture) => {
    const u = material.uniforms[key]; if (!u) return;
    u.value = tex; gl.initTexture(tex); // upload now, not on first close-up frame
  };
  load(spec.primary, gl).then(apply('planetMap')).catch(() => { state.requested = false; });
  if (spec.secondary) load(spec.secondary, gl).then(apply('planetMapSecondary')).catch(() => {});
}
