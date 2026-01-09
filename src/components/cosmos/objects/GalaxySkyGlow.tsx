import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

/**
 * Camera-centered sky-dome glow (not a world object).
 * Root cause: the camera cannot render objects behind it.
 * Solution: render a background dome whose intensity depends on the real galactic-center direction,
 * so the glow remains visible even when you turn your back.
 */
export const GalaxySkyGlow = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const centerDirView = useRef(new THREE.Vector3(0, 0, -1));
  const tmpDir = useRef(new THREE.Vector3());
  const tmpMat3 = useRef(new THREE.Matrix3());

  const { camera } = useThree();
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
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      toneMapped: false,
      uniforms: {
        uCenterDirView: { value: new THREE.Vector3(0, 0, -1) },
        uMin: { value: 0.06 },
        uMax: { value: 0.22 },
      },
      vertexShader: `
        varying vec3 vViewDir;
        void main() {
          // Direction from camera in VIEW space
          vec3 viewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vViewDir = normalize(viewPos);
          gl_Position = projectionMatrix * vec4(viewPos, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vViewDir;
        uniform vec3 uCenterDirView;
        uniform float uMin;
        uniform float uMax;

        vec3 toLinear(vec3 c) {
          return pow(c, vec3(2.2));
        }

        vec3 ramp(float t) {
          // t: 0 (center) -> 1 (edge)
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
          vec3 dir = normalize(vViewDir);
          vec3 cdir = normalize(uCenterDirView);

          // When the center is behind, the sky-dome still glows (scatter), so we use abs(dot)
          float d = clamp(dot(dir, cdir), -1.0, 1.0);
          float facing = clamp((d + 1.0) * 0.5, 0.0, 1.0);

          // Angular distance to the (possibly behind) galactic center axis
          float ad = acos(clamp(abs(d), 0.0, 1.0));
          // Normalize (0..~pi/2) -> (0..1)
          float t = clamp(ad / 1.5707963, 0.0, 1.0);

          vec3 col = ramp(t);

          // Soft falloff: strong near center axis, still present across the sky
          float alpha = exp(-pow(t * 1.35, 2.0));

          float intensity = mix(uMin, uMax, pow(facing, 1.6));

          gl_FragColor = vec4(col * alpha * intensity, alpha * intensity);
        }
      `,
    });
  }, []);

  useFrame(() => {
    const m = meshRef.current;
    if (!m) return;

    // Keep the dome centered on the camera (no parallax)
    m.position.copy(camera.position);

    // Update uniform direction (world -> view)
    if (centerPos) {
      tmpDir.current
        .set(centerPos[0], centerPos[1], centerPos[2])
        .sub(camera.position)
        .normalize();

      tmpMat3.current.setFromMatrix4(camera.matrixWorldInverse);
      centerDirView.current.copy(tmpDir.current).applyMatrix3(tmpMat3.current).normalize();

      (material.uniforms.uCenterDirView.value as THREE.Vector3).copy(centerDirView.current);
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-200}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};
