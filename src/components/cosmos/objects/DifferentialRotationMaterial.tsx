import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

interface DifferentialRotationMaterialProps {
  size: number;
  map: THREE.Texture;
  opacity?: number;
  maxRadius: number; // The maximum radius of the galaxy for normalization
  rotationMultiplier?: number; // Base rotation speed multiplier
  /**
   * 0 = rigid rotation (preserves spiral shape), 1 = fully differential.
   * Using a small value prevents spiral arms from shearing over time.
   */
  differentialStrength?: number;
}

/**
 * Custom ShaderMaterial for galaxy stars with differential rotation.
 * Inner stars rotate faster than outer stars, simulating real galactic rotation.
 * 
 * Uses a simplified rotation curve where angular velocity ∝ 1/sqrt(r)
 * (Keplerian-like, but with a flat rotation curve at larger radii like real galaxies)
 */
export const useDifferentialRotationMaterial = ({
  size,
  map,
  opacity = 1,
  maxRadius,
  rotationMultiplier = 1,
  differentialStrength = 1,
}: DifferentialRotationMaterialProps) => {
  const timeRef = useRef(0);
  const isInStarSystem = useCosmosStore((s) => s.isInStarSystem);
  const timeSpeed = useCosmosStore((s) => s.timeSpeed);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uMap: { value: map },
        uOpacity: { value: opacity },
        uMaxRadius: { value: maxRadius },
        uRotationMultiplier: { value: rotationMultiplier },
        uDifferentialStrength: { value: differentialStrength },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uMaxRadius;
        uniform float uRotationMultiplier;
        uniform float uDifferentialStrength;
        
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Calculate distance from galactic center (in XZ plane)
          float dist = length(position.xz);
          
          // Normalize distance (0 = center, 1 = edge)
          float normalizedDist = clamp(dist / uMaxRadius, 0.01, 1.0);
          
          // Differential rotation: inner stars rotate faster than outer stars.
          float differentialOmega = uRotationMultiplier / (0.3 + normalizedDist * 0.7);

          // Rigid rotation: preserves the initial spiral-arm geometry.
          float rigidOmega = uRotationMultiplier;

          // Blend between rigid and differential rotation to avoid arm "shearing".
          float omega = mix(rigidOmega, differentialOmega, clamp(uDifferentialStrength, 0.0, 1.0));
          float angle = uTime * omega;
          
          // Rotate position around Y axis
          float cosA = cos(angle);
          float sinA = sin(angle);
          vec3 rotatedPos = vec3(
            position.x * cosA - position.z * sinA,
            position.y,
            position.x * sinA + position.z * cosA
          );
          
          vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 100.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * uOpacity);
        }
      `,
    });
  }, [size, map, opacity, maxRadius, rotationMultiplier, differentialStrength]);

  // Update time uniform each frame
  useFrame((_, delta) => {
    if (!isInStarSystem) {
      // Base speed: 0.00625 rad/s at 1x speed (same as before)
      timeRef.current += delta * 0.00625 * timeSpeed;
    }
    material.uniforms.uTime.value = timeRef.current;
  });

  return material;
};

/**
 * Component wrapper for the differential rotation material
 */
export const DifferentialRotationPoints = ({
  geometry,
  size,
  map,
  opacity = 1,
  maxRadius,
  rotationMultiplier = 1,
  differentialStrength = 1,
  frustumCulled = false,
  renderOrder = 0,
}: {
  geometry: THREE.BufferGeometry;
  size: number;
  map: THREE.Texture;
  opacity?: number;
  maxRadius: number;
  rotationMultiplier?: number;
  differentialStrength?: number;
  frustumCulled?: boolean;
  renderOrder?: number;
}) => {
  const material = useDifferentialRotationMaterial({
    size,
    map,
    opacity,
    maxRadius,
    rotationMultiplier,
    differentialStrength,
  });

  return (
    <points 
      geometry={geometry} 
      material={material} 
      frustumCulled={frustumCulled}
      renderOrder={renderOrder}
    />
  );
};
