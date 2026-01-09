import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

/**
 * Screen-space glow that is *anchored to the actual galactic center direction*.
 * This avoids the "random" fullscreen glow look and keeps the same color palette
 * even when the center goes behind the camera (intensity just softens).
 */
export const GalaxyDirectionalGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { camera, size } = useThree();
  const currentScale = useCosmosStore((s) => s.currentScale);
  const centerPos = useCosmosStore((s) => s.objectWorldPositions["milky-way-center"]);

  const visible =
    currentScale === "stellar" ||
    currentScale === "milkyWay" ||
    currentScale === "localGroup" ||
    currentScale === "universe";

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1 },
        uIntensity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec2 vUv;
        uniform vec2 uCenter;
        uniform float uAspect;
        uniform float uIntensity;

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

          // Soft radius falloff (keep it subtle; intensity handled by uIntensity)
          float alpha = smoothstep(0.95, 0.0, r);

          // Slightly compress so the color transition happens closer to the center
          float t = clamp(r * 1.15, 0.0, 1.0);
          vec3 col = ramp(t);

          // Keep a floor so you still see color when behind camera
          float k = clamp(uIntensity, 0.0, 1.0);
          float gain = mix(0.18, 0.75, k);

          gl_FragColor = vec4(col * alpha * gain, alpha * gain);
        }
      `,
    });

    return m;
  }, []);

  useFrame(() => {
    const m = meshRef.current;
    if (!m) return;

    // Scale plane to fill the viewport at distance d
    const d = 1;
    const perspective = camera as THREE.PerspectiveCamera;
    const fovRad = (perspective.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovRad / 2) * d;
    const width = height * (size.width / size.height);
    m.scale.set(width, height, 1);

    // Place it in front of camera and match orientation
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    m.position.copy(camera.position).addScaledVector(forward, d);
    m.quaternion.copy(camera.quaternion);

    // Update uniforms based on true galactic center direction
    const uniforms = material.uniforms as any;
    uniforms.uAspect.value = size.width / size.height;

    if (!centerPos) {
      uniforms.uCenter.value.set(0.5, 0.5);
      uniforms.uIntensity.value = 0;
      return;
    }

    const centerWorld = new THREE.Vector3(centerPos[0], centerPos[1], centerPos[2]);
    const toCenter = centerWorld.clone().sub(camera.position);

    // Directional intensity: 1 when looking at center, 0 when opposite
    const toCenterDir = toCenter.clone().normalize();
    const lookDir = forward.clone().normalize();
    const dot = lookDir.dot(toCenterDir); // [-1..1]
    const facing = THREE.MathUtils.clamp((dot + 1) * 0.5, 0, 1);
    uniforms.uIntensity.value = facing;

    // Screen-space anchor:
    // - if center is behind camera, keep glow centered (diffuse sky glow)
    // - if in front, anchor glow towards projected position
    // In camera space, forward is -Z. If z > 0 => behind.
    const centerCam = centerWorld.clone().applyMatrix4(camera.matrixWorldInverse);
    if (centerCam.z > 0) {
      uniforms.uCenter.value.set(0.5, 0.5);
      return;
    }

    const ndc = centerWorld.clone().project(camera);
    // Convert NDC [-1..1] -> UV [0..1]
    const u = (ndc.x + 1) * 0.5;
    const v = (ndc.y + 1) * 0.5;

    // Clamp so the glow doesn't jump when the center is just off-screen
    uniforms.uCenter.value.set(
      THREE.MathUtils.clamp(u, 0.0, 1.0),
      THREE.MathUtils.clamp(v, 0.0, 1.0)
    );
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-100}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
