import React, { forwardRef, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DimStarsProps {
  radius?: number;
  depth?: number;
  count?: number;
  /** Size factor for each star point (similar to drei's Stars factor) */
  factor?: number;
  saturation?: number;
  /** Lightness (0..1). drei Stars uses 0.9 which is very bright. */
  lightness?: number;
  /** Enables soft edge falloff (recommended) */
  fade?: boolean;
  speed?: number;
  /** Global alpha multiplier (0..1) */
  opacity?: number;
  /** Use additive blending (glow-y) or normal blending (dimmer). */
  blending?: "additive" | "normal";
}

class DimStarfieldMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0.0 },
        fade: { value: 1.0 },
        uOpacity: { value: 1.0 },
      },
      vertexShader: /* glsl */ `
        uniform float time;
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (30.0 / -mvPosition.z) * (2.0 + 0.5 * sin(time + 100.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float fade;
        uniform float uOpacity;
        varying vec3 vColor;

        void main() {
          float opacity = 1.0;
          if (fade == 1.0) {
            float d = distance(gl_PointCoord, vec2(0.5, 0.5));
            opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
          }
          gl_FragColor = vec4(vColor, opacity * uOpacity);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
    });
  }
}

const genStar = (r: number) => {
  return new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI)
  );
};

export const DimStars = forwardRef<THREE.Points, DimStarsProps>(
  (
    {
      radius = 100,
      depth = 50,
      count = 5000,
      saturation = 0,
      lightness = 0.65,
      factor = 2,
      fade = true,
      speed = 1,
      opacity = 0.12,
      blending = "normal",
    },
    ref
  ) => {
    const materialRef = useRef<DimStarfieldMaterial | null>(null);

    const [position, color, size] = useMemo(() => {
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes = Array.from({ length: count }, () => (0.5 + 0.5 * Math.random()) * factor);

      const c = new THREE.Color();
      let r = radius + depth;
      const increment = depth / count;

      for (let i = 0; i < count; i++) {
        r -= increment * Math.random();
        positions.push(...genStar(r).toArray());
        c.setHSL(i / count, saturation, lightness);
        colors.push(c.r, c.g, c.b);
      }

      return [new Float32Array(positions), new Float32Array(colors), new Float32Array(sizes)] as const;
    }, [count, depth, factor, radius, saturation, lightness]);

    const [mat] = useState(() => new DimStarfieldMaterial());

    useFrame((state) => {
      if (!materialRef.current) return;
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * speed;
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.fade.value = fade ? 1.0 : 0.0;
    });

    const threeBlending = blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending;

    return (
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[position, 3]} />
          <bufferAttribute attach="attributes-color" args={[color, 3]} />
          <bufferAttribute attach="attributes-size" args={[size, 1]} />
        </bufferGeometry>
        <primitive
          ref={materialRef}
          object={mat}
          attach="material"
          blending={threeBlending}
        />
      </points>
    );
  }
);

DimStars.displayName = "DimStars";
