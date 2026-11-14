// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HALF_ANGLE = 0.02; // radians around the site (~35 km on the Moon, ~68 km on Mars)
const SEGMENTS = 160;

/**
 * Finely tessellated true-radius cap of the parent body around a landing site, rendered only
 * while that machine is followed. The body's 128-segment sphere sags hundreds of metres between
 * vertices, so close-ups showed machines floating over flickering facets; this cap sags millimetres.
 * It reuses the parent body's own material with UVs remapped to the global texture.
 */
export function SitePatch({ local, radius, mesh }: { local: [number, number, number]; radius: number; mesh: THREE.Mesh }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const [x, y, z] = local, r = Math.hypot(x, y, z) || 1;
    const theta = Math.acos(Math.max(-1, Math.min(1, y / r)));
    const phi = Math.atan2(z, -x);
    const t0 = Math.max(0, theta - HALF_ANGLE), tLen = Math.min(Math.PI, theta + HALF_ANGLE) - t0;
    const pLen = Math.min(Math.PI * 2, (HALF_ANGLE * 2) / Math.max(Math.sin(theta), 0.05));
    const p0 = phi - pLen / 2;
    const g = new THREE.SphereGeometry(radius, SEGMENTS, SEGMENTS, p0, pLen, t0, tLen);
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      uv.setXY(i, (p0 + u * pLen) / (Math.PI * 2), 1 - (t0 + (1 - v) * tLen) / Math.PI);
    }
    uv.needsUpdate = true;
    return g;
  }, [local, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => { if (ref.current && ref.current.material !== mesh.material) ref.current.material = mesh.material; });
  return <mesh ref={ref} geometry={geometry} material={mesh.material} renderOrder={1} raycast={() => null} />;
}
