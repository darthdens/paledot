import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

// Fade duration in seconds
const FADE_DURATION = 1.2;

/**
 * Galaxy ambient glow rendered in screen-space.
 *
 * Why: A world-space glow can disappear when the galactic center is behind the camera.
 * This draws a fullscreen background shader and drives it from the true galactic-center
 * direction (in view space), so it remains present regardless of camera orientation.
 */
export const GalaxySkyGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentOpacity = useRef(0);

  // This background plane should never intercept clicks meant for scene objects.
  const disableRaycast = useMemo(() => ((_: any, __: any) => {}) as any, []);

  const tmpDirWorld = useRef(new THREE.Vector3());
  const tmpCenterView = useRef(new THREE.Vector3());
  const tmpMat3 = useRef(new THREE.Matrix3());

  const { camera } = useThree();
  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  const currentScale = useCosmosStore((s) => s.currentScale);
  const centerPos = useCosmosStore((s) => s.objectWorldPositions["milky-way-center"]);

  // Target opacity: 0 when in star system OR when zoomed out to local group/universe scale
  // The glow should only be visible when we're in the Milky Way but outside a star system
  const isZoomedOutTooFar = currentScale === 'localGroup' || currentScale === 'universe';
  const targetOpacity = (isInStarSystem || isZoomedOutTooFar) ? 0 : 1;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
      uniforms: {
        uCenterDirView: { value: new THREE.Vector3(0, 0, -1) },
        uInvProjection: { value: new THREE.Matrix4() },
        // Tuned to be clearly visible but not overpowering.
        uBase: { value: 0.18 },
        uPeak: { value: 0.55 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Fullscreen quad in clip space
          gl_Position = vec4(position.xy, 0.999999, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec2 vUv;

        uniform vec3 uCenterDirView;
        uniform mat4 uInvProjection;
        uniform float uBase;
        uniform float uPeak;
        uniform float uOpacity;

        vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

        vec3 ramp(float t) {
          // t: 0 (center axis) -> 1 (edge)
          vec3 c0 = toLinear(vec3(1.00, 0.86, 0.31)); // yellow
          vec3 c1 = toLinear(vec3(1.00, 0.63, 0.16)); // yellow-orange
          vec3 c2 = toLinear(vec3(1.00, 0.47, 0.12)); // orange
          vec3 c3 = toLinear(vec3(0.78, 0.31, 0.55)); // orange-purple
          vec3 c4 = toLinear(vec3(0.55, 0.27, 0.78)); // purple
          vec3 c5 = toLinear(vec3(0.31, 0.39, 0.86)); // blue

          vec3 col = c0;
          col = mix(col, c1, smoothstep(0.08, 0.18, t));
          col = mix(col, c2, smoothstep(0.18, 0.32, t));
          col = mix(col, c3, smoothstep(0.32, 0.48, t));
          col = mix(col, c4, smoothstep(0.48, 0.65, t));
          col = mix(col, c5, smoothstep(0.65, 0.85, t));
          return col;
        }

        void main() {
          // Reconstruct a view-space ray direction from UV using inverse projection.
          vec2 ndc = vUv * 2.0 - 1.0;
          vec4 clip = vec4(ndc, 1.0, 1.0);
          vec4 view = uInvProjection * clip;
          vec3 dir = normalize(view.xyz / view.w);

          vec3 cdir = normalize(uCenterDirView);

          // Use abs() so the glow remains when the galactic center is behind the camera.
          float d = clamp(abs(dot(dir, cdir)), 0.0, 1.0);

          // Angular distance (0..pi/2) normalized to 0..1
          float ad = acos(clamp(d, 0.0, 1.0));
          float t = clamp(ad / 1.5707963, 0.0, 1.0);

          vec3 col = ramp(t);

          // Broad background + brighter core-axis
          float base = 1.0 - smoothstep(0.35, 1.0, t);
          float core = exp(-pow(t * 1.15, 2.0));

          float intensity = (uBase * base + uPeak * core) * uOpacity;

          // Use opacity for alpha as well for proper fade
          gl_FragColor = vec4(col * intensity, uOpacity);
        }
      `,
    });
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;

    // Keep it in camera space so it doesn't suffer from large world-coordinate precision.
    camera.add(m);
    m.position.set(0, 0, -0.2);
    m.scale.setScalar(1);

    return () => {
      camera.remove(m);
    };
  }, [camera]);

  useFrame((_, delta) => {
    // Smooth opacity transition
    const diff = targetOpacity - currentOpacity.current;
    const step = delta / FADE_DURATION;
    
    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += Math.sign(diff) * Math.min(Math.abs(diff), step);
    } else {
      currentOpacity.current = targetOpacity;
    }
    
    material.uniforms.uOpacity.value = currentOpacity.current;
    
    // Keep inverse projection up to date (FOV/resize).
    (material.uniforms.uInvProjection.value as THREE.Matrix4).copy(camera.projectionMatrixInverse);

    // Update galactic center direction (world -> view)
    if (centerPos) {
      tmpDirWorld.current
        .set(centerPos[0], centerPos[1], centerPos[2])
        .sub(camera.position)
        .normalize();

      tmpMat3.current.setFromMatrix4(camera.matrixWorldInverse);
      tmpCenterView.current.copy(tmpDirWorld.current).applyMatrix3(tmpMat3.current).normalize();

      (material.uniforms.uCenterDirView.value as THREE.Vector3).copy(tmpCenterView.current);
    }
  });

  // Always render, but with opacity controlling visibility
  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-1000} raycast={disableRaycast}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
