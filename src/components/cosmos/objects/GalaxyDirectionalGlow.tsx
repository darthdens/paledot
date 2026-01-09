import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

/**
 * Screen-space glow that represents the galactic center light.
 * Uses a fullscreen shader quad that ALWAYS renders, shifting the glow center
 * based on where the galactic center is (or was) on screen.
 * When the center goes behind the camera, we keep the glow centered but maintain color.
 */
export const GalaxyDirectionalGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastValidUV = useRef(new THREE.Vector2(0.5, 0.5));

  const { camera, size } = useThree();
  const currentScale = useCosmosStore((s) => s.currentScale);
  const centerPos = useCosmosStore((s) => s.objectWorldPositions["milky-way-center"]);

  const visible =
    currentScale === "stellar" ||
    currentScale === "milkyWay" ||
    currentScale === "localGroup" ||
    currentScale === "universe";

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1 },
        uBaseIntensity: { value: 0.35 }, // Always-visible floor
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec2 vUv;
        uniform vec2 uCenter;
        uniform float uAspect;
        uniform float uBaseIntensity;

        vec3 ramp(float t) {
          // t: 0 (center) -> 1 (edge)
          vec3 c0 = vec3(1.00, 0.86, 0.31); // yellow
          vec3 c1 = vec3(1.00, 0.63, 0.16); // yellow-orange
          vec3 c2 = vec3(1.00, 0.47, 0.12); // orange
          vec3 c3 = vec3(0.78, 0.31, 0.55); // orange-purple
          vec3 c4 = vec3(0.55, 0.27, 0.78); // purple
          vec3 c5 = vec3(0.31, 0.39, 0.86); // blue

          vec3 col = c0;
          col = mix(col, c1, smoothstep(0.08, 0.18, t));
          col = mix(col, c2, smoothstep(0.18, 0.32, t));
          col = mix(col, c3, smoothstep(0.32, 0.48, t));
          col = mix(col, c4, smoothstep(0.48, 0.65, t));
          col = mix(col, c5, smoothstep(0.65, 0.85, t));
          return col;
        }

        void main() {
          vec2 d = vUv - uCenter;
          d.x *= uAspect;
          float r = length(d);

          // Very soft falloff to keep glow visible across entire screen
          float alpha = 1.0 - smoothstep(0.0, 1.2, r);

          float t = clamp(r * 0.9, 0.0, 1.0);
          vec3 col = ramp(t);

          gl_FragColor = vec4(col * alpha * uBaseIntensity, alpha * uBaseIntensity);
        }
      `,
    });
  }, []);

  useFrame(() => {
    const m = meshRef.current;
    if (!m) return;

    const uniforms = material.uniforms as {
      uCenter: { value: THREE.Vector2 };
      uAspect: { value: number };
      uBaseIntensity: { value: number };
    };
    uniforms.uAspect.value = size.width / size.height;

    if (!centerPos) {
      // No center tracked yet – keep last known or center
      uniforms.uCenter.value.copy(lastValidUV.current);
      return;
    }

    const centerWorld = new THREE.Vector3(centerPos[0], centerPos[1], centerPos[2]);

    // Check if galactic center is in front of or behind camera
    const centerCam = centerWorld.clone().applyMatrix4(camera.matrixWorldInverse);
    const isBehind = centerCam.z > 0;

    if (isBehind) {
      // Keep glow centered when galaxy center is behind camera
      // This gives the "ambient sky glow" effect
      uniforms.uCenter.value.set(0.5, 0.5);
    } else {
      // Project to screen and anchor glow there
      const ndc = centerWorld.clone().project(camera);
      const u = THREE.MathUtils.clamp((ndc.x + 1) * 0.5, 0.0, 1.0);
      const v = THREE.MathUtils.clamp((ndc.y + 1) * 0.5, 0.0, 1.0);
      uniforms.uCenter.value.set(u, v);
      lastValidUV.current.set(u, v);
    }
  });

  if (!visible) return null;

  // Fullscreen quad using clip-space coordinates (-1 to 1)
  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-100}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

