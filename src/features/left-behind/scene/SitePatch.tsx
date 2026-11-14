// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { getTerrainIndex, terrainImageUrl, type TerrainTier } from '../data/dataClient';
import { TEXTURE_LON_OFFSET_DEG } from '../lib/geo';

const SEGMENTS = 192;

/** Wraps a longitude to the -180..180 range used by terrain/index.json. */
const wrap = (lon: number) => ((lon + 540) % 360) - 180;

/**
 * Real NASA orbital imagery around a landing site, shown while that machine is followed:
 * a ~40–60 km "mid" cap and a ~2–8 km "near" cap (LRO NAC, MRO HiRISE/CTX; see terrain/index.json).
 * Each cap is a finely tessellated true-radius piece of the body's sphere, so close-ups don't sit on
 * the body's coarse facets. The greyscale imagery adds real detail; colour comes from the body's own
 * global map, so the caps blend into the rest of the planet.
 */
export function SitePatch({ body, lat, lon, radius, mesh }: { body: 'moon' | 'mars'; lat: number; lon: number; radius: number; mesh: THREE.Mesh }) {
  const [tiers, setTiers] = useState<TerrainTier[]>([]);
  useEffect(() => {
    let alive = true;
    getTerrainIndex().then(idx => {
      const L = wrap(lon);
      const hit = idx.sites.filter(s => s.body === body).flatMap(s => s.tiers)
        .filter(t => lat >= t.south && lat <= t.north && L >= t.west && L <= t.east);
      if (alive) setTiers(hit.sort((a, b) => (a.tier === 'mid' ? -1 : 1) - (b.tier === 'mid' ? -1 : 1)));
    }).catch(() => {});
    return () => { alive = false; };
  }, [body, lat, lon]);
  return <>{tiers.map((t, i) => <TierCap key={t.file} tier={t} order={i} radius={radius} mesh={mesh} body={body} />)}</>;
}

function TierCap({ tier, order, radius, mesh, body }: { tier: TerrainTier; order: number; radius: number; mesh: THREE.Mesh; body: 'moon' | 'mars' }) {
  const gl = useThree(s => s.gl);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true, loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().loadAsync(terrainImageUrl(tier.file)).then(t => {
      t.colorSpace = THREE.NoColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy();
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; loaded = t;
      if (alive) setTex(t); else t.dispose();
    }).catch(() => {});
    return () => { alive = false; loaded?.dispose(); };
  }, [tier.file, gl]);

  const offset = TEXTURE_LON_OFFSET_DEG[body] ?? 0;
  const geometry = useMemo(() => {
    // three.js sphere: phi = PI + lon (see geo.ts latLonToLocal), theta = PI/2 - lat.
    const d = Math.PI / 180;
    const phi0 = Math.PI + (tier.west + offset) * d, phiLen = (tier.east - tier.west) * d;
    const theta0 = Math.PI / 2 - tier.north * d, thetaLen = (tier.north - tier.south) * d;
    const g = new THREE.SphereGeometry(radius, SEGMENTS, SEGMENTS, phi0, phiLen, theta0, thetaLen);
    // Rebase vertices on the cap's own centre: body-centred coordinates (~radius) in float32 only resolve
    // ~0.1 m, which makes the ground shake at metre-scale views. Cap-local coordinates resolve millimetres.
    g.computeBoundingBox(); const origin = g.boundingBox!.getCenter(new THREE.Vector3());
    g.translate(-origin.x, -origin.y, -origin.z); g.userData['origin'] = origin;
    return g;
  }, [tier, radius, offset]);
  const origin = geometry.userData['origin'] as THREE.Vector3;
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const src = mesh.material as THREE.ShaderMaterial;
    const globalMap = src.uniforms?.['planetMap'];
    // Patch rectangle inside the global equirectangular map (u = 0.5 at 0° lon).
    const u0 = (tier.west + offset + 180) / 360, v0 = (tier.south + 90) / 180;
    return new THREE.ShaderMaterial({
      transparent: true, polygonOffset: true, polygonOffsetFactor: -2 - order * 2, polygonOffsetUnits: -8 - order * 8,
      uniforms: {
        detailMap: { value: null as THREE.Texture | null },
        globalMap: globalMap ?? { value: null },
        rect: { value: new THREE.Vector4(u0, v0, (tier.east - tier.west) / 360, (tier.north - tier.south) / 180) },
        texel: { value: 1 / tier.px },
        isMars: { value: body === 'mars' ? 1 : 0 },
        sunDir: { value: new THREE.Vector3(1, 0, 0) },
        origin: { value: origin },
      },
      vertexShader: /* glsl */`
        uniform vec3 origin;
        varying vec2 vUv; varying vec3 vNormalW; varying vec3 vEast;
        void main() {
          vUv = uv;
          vec3 bodyPos = position + origin;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vEast = normalize(mat3(modelMatrix) * vec3(bodyPos.z, 0.0, -bodyPos.x));
          // modelViewMatrix is composed on the CPU in double precision; world coordinates (~1e5 scene units)
          // in float32 would snap these km-sized caps to a ~8 km grid.
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D detailMap; uniform sampler2D globalMap; uniform vec4 rect; uniform float texel; uniform float isMars; uniform vec3 sunDir;
        varying vec2 vUv; varying vec3 vNormalW; varying vec3 vEast;
        float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
        void main() {
          vec3 base = texture2D(globalMap, rect.xy + vUv * rect.zw).rgb;
          // Real NASA detail as a ratio to its own local average, applied to the global colour.
          float d = texture2D(detailMap, vUv).r;
          float avg = max(texture2D(detailMap, vUv, 6.0).r, 0.02);
          float ratio = clamp(d / avg, 0.15, 3.0);
          vec3 albedo = base * ratio;
          if (isMars > 0.5) albedo *= vec3(1.0, 0.85, 0.75);
          // Gentle slope shading from the same image.
          float hL = texture2D(detailMap, vUv - vec2(texel, 0.0)).r, hR = texture2D(detailMap, vUv + vec2(texel, 0.0)).r;
          float hD = texture2D(detailMap, vUv - vec2(0.0, texel)).r, hU = texture2D(detailMap, vUv + vec2(0.0, texel)).r;
          vec3 n = normalize(vNormalW), e = normalize(vEast), nn = normalize(cross(n, e));
          vec3 pn = normalize(n + (e * (hL - hR) + nn * (hD - hU)) * 1.2);
          float ndl = mix(max(dot(n, sunDir), 0.0), max(dot(pn, sunDir), 0.0), 0.5);
          float moonLift = isMars > 0.5 ? 1.0 : (0.7 + 0.5 * ndl);
          // Eye-adapted exposure for ground-level views: low sun angles stay readable, night stays dark.
          vec3 col = albedo * moonLift * (0.012 + 0.988 * sqrt(ndl)) * 1.25;
          // Fade the edges into the body's own surface.
          vec2 edge = min(vUv, 1.0 - vUv);
          float a = smoothstep(0.0, 0.08, min(edge.x, edge.y));
          gl_FragColor = vec4(col, a);
        }`,
    });
  }, [mesh.material, tier, order, body, offset, origin]);
  useEffect(() => { material.uniforms['detailMap']!.value = tex; }, [material, tex]);
  useEffect(() => () => material.dispose(), [material]);
  if (!tex) return null;
  // The Sun sits at the scene origin: light direction from the cap's own world position (CPU doubles).
  return <mesh position={origin} geometry={geometry} material={material} renderOrder={1 + order} raycast={() => null}
    onBeforeRender={function (this: THREE.Mesh) { (material.uniforms['sunDir']!.value as THREE.Vector3).setFromMatrixPosition(this.matrixWorld).negate().normalize(); }} />;
}
