// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * True-scale single-scattering atmosphere. The shell is only as thick as the real atmosphere
 * (a few scale heights), and each pixel ray-marches it analytically in the body's local frame,
 * with camera and Sun positions computed on the CPU in double precision.
 * Scale heights are published values (NASA planetary fact sheets); scattering colours/strengths are
 * calibrated approximations (Earth uses standard Rayleigh coefficients).
 */
export type AtmosphereSpec = {
  scaleHeightKm: number;
  /** Scattering coefficient at the reference altitude, per km, RGB. */
  beta: [number, number, number];
  /** Henyey–Greenstein asymmetry: 0 = gas (Rayleigh-like), ~0.7 = dust/haze (forward scattering). */
  g: number;
  /** Sunlight scale: π maps a white Lambert surface to display white; a bit more for visibility. */
  sun: number;
};

export const ATMOSPHERES: Record<string, AtmosphereSpec> = {
  // Rayleigh at sea level: 5.8, 13.5, 33.1 (×10⁻³ /km) — blue sky, thin blue limb, red sunsets.
  earth: { scaleHeightKm: 8.5, beta: [5.8e-3, 13.5e-3, 33.1e-3], g: 0, sun: 6 },
  // Thin CO₂ with suspended dust: butterscotch haze by day, bluish forward-scattered glow near sunset.
  mars: { scaleHeightKm: 11.1, beta: [45e-3, 33e-3, 22e-3], g: 0.65, sun: 4 },
  // Above the cloud deck the drawn sphere represents: sulphuric haze, pale yellow.
  venus: { scaleHeightKm: 15.9, beta: [20e-3, 17e-3, 11e-3], g: 0.6, sun: 4 },
  // Thick orange organic haze extending hundreds of km.
  titan: { scaleHeightKm: 40, beta: [60e-3, 30e-3, 10e-3], g: 0.6, sun: 4 },
  jupiter: { scaleHeightKm: 27, beta: [0.6e-3, 0.9e-3, 1.6e-3], g: 0.2, sun: 6 },
  saturn: { scaleHeightKm: 59.5, beta: [0.5e-3, 0.65e-3, 0.9e-3], g: 0.2, sun: 6 },
  uranus: { scaleHeightKm: 27.7, beta: [0.6e-3, 1.4e-3, 1.8e-3], g: 0.1, sun: 6 },
  neptune: { scaleHeightKm: 19.7, beta: [0.6e-3, 1.3e-3, 2.6e-3], g: 0.1, sun: 6 },
  // Very thin, blue nitrogen haze layers seen by New Horizons.
  pluto: { scaleHeightKm: 50, beta: [0.05e-3, 0.1e-3, 0.22e-3], g: 0.5, sun: 6 },
  triton: { scaleHeightKm: 14, beta: [0.02e-3, 0.04e-3, 0.08e-3], g: 0.3, sun: 6 },
};

const SHELL_HEIGHTS = 10; // shell top in scale heights (density e⁻¹⁰ ≈ nothing beyond)

export function Atmosphere({ id, radius }: { id: string; radius: number }) {
  const spec = ATMOSPHERES[id]!;
  const meshRef = useRef<THREE.Mesh>(null);
  const rKm = radius * 1000; // 1 scene unit = 1000 km
  const topKm = rKm + spec.scaleHeightKm * SHELL_HEIGHTS;
  const v = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    camLocal: { value: new THREE.Vector3() },
    sunDir: { value: new THREE.Vector3(1, 0, 0) },
    rKm: { value: rKm }, topKm: { value: topKm }, hKm: { value: spec.scaleHeightKm },
    beta: { value: new THREE.Vector3(...spec.beta) }, g: { value: spec.g }, sunI: { value: spec.sun },
  }), [rKm, topKm, spec]);

  useFrame(({ camera }) => {
    const m = meshRef.current; if (!m) return;
    m.updateWorldMatrix(true, false);
    const inv = v.copy(camera.position); m.worldToLocal(inv); uniforms.camLocal.value.copy(inv).multiplyScalar(1000);
    v.set(0, 0, 0); m.worldToLocal(v); uniforms.sunDir.value.copy(v).normalize(); // the Sun sits at the world origin
  });

  return (
    <mesh ref={meshRef} renderOrder={2} frustumCulled={false}>
      <sphereGeometry args={[(topKm / 1000) * 1.003, 96, 64]} />
      <shaderMaterial
        transparent depthWrite={false} depthTest={false} side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vLocal;
          void main() { vLocal = position * 1000.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={`
          varying vec3 vLocal;
          uniform vec3 camLocal; uniform vec3 sunDir; uniform float rKm; uniform float topKm; uniform float hKm;
          uniform vec3 beta; uniform float g; uniform float sunI;
          vec2 hitSphere(vec3 ro, vec3 rd, float r) {
            float b = dot(ro, rd), c = dot(ro, ro) - r * r, d = b * b - c;
            if (d < 0.0) return vec2(1e9, -1e9);
            d = sqrt(d); return vec2(-b - d, -b + d);
          }
          float odToSun(vec3 p) {
            if (hitSphere(p, sunDir, rKm * 0.999).x > 0.0 && hitSphere(p, sunDir, rKm * 0.999).y > 0.0) return 1e9; // planet shadow
            float tEnd = hitSphere(p, sunDir, topKm).y, ds = tEnd / 6.0, od = 0.0;
            for (int i = 0; i < 6; i++) { vec3 q = p + sunDir * ds * (float(i) + 0.5); od += exp(-(length(q) - rKm) / hKm) * ds; }
            return od;
          }
          void main() {
            vec3 ro = camLocal, rd = normalize(vLocal - camLocal);
            vec2 a = hitSphere(ro, rd, topKm);
            if (a.y < 0.0) discard;
            float t0 = max(a.x, 0.0), t1 = a.y;
            vec2 pl = hitSphere(ro, rd, rKm);
            if (pl.x > 0.0) t1 = min(t1, pl.x);
            float ds = (t1 - t0) / 16.0, odView = 0.0;
            vec3 sum = vec3(0.0);
            for (int i = 0; i < 16; i++) {
              vec3 p = ro + rd * (t0 + ds * (float(i) + 0.5));
              float dens = exp(-(length(p) - rKm) / hKm) * ds;
              odView += dens * 0.5;
              float odL = odToSun(p);
              if (odL < 1e8) sum += dens * exp(-beta * (odView + odL));
              odView += dens * 0.5;
            }
            float mu = dot(rd, sunDir);
            float ray = 0.0596831 * (1.0 + mu * mu);
            float hg = 0.0795775 * (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5);
            vec3 col = sunI * beta * sum * mix(ray, hg, step(0.01, g));
            col = 1.0 - exp(-col); // soft exposure, never clips
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}
