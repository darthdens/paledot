import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from './store/useCosmosStore';

export const CameraController = () => {
  const { camera, controls } = useThree();
  const selectedObject = useCosmosStore(state => state.selectedObject);
  
  const isAnimating = useRef(false);
  const animationProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const endPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const endTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selectedObject && controls) {
      // Start fly-to animation
      isAnimating.current = true;
      animationProgress.current = 0;
      
      // Store current camera position
      startPosition.current.copy(camera.position);
      
      // Store current OrbitControls target
      const orbitControls = controls as any;
      if (orbitControls.target) {
        startTarget.current.copy(orbitControls.target);
      }
      
      // Calculate end target (the object's position)
      endTarget.current.set(...selectedObject.position);
      
      // Calculate end position: offset from object based on its size
      const visualSize = selectedObject.size * 300; // Match visual scale
      const distance = Math.max(visualSize * 4, 1e7);
      endPosition.current.set(
        selectedObject.position[0] + distance * 0.5,
        selectedObject.position[1] + distance * 0.3,
        selectedObject.position[2] + distance
      );
    }
  }, [selectedObject, camera, controls]);

  useFrame((_, delta) => {
    if (isAnimating.current && controls) {
      // Smooth easing animation
      animationProgress.current += delta * 0.8; // Animation speed
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }
      
      // Ease in-out cubic
      const t = animationProgress.current;
      const eased = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Interpolate camera position
      camera.position.lerpVectors(
        startPosition.current,
        endPosition.current,
        eased
      );
      
      // Interpolate OrbitControls target
      const orbitControls = controls as any;
      if (orbitControls.target) {
        orbitControls.target.lerpVectors(
          startTarget.current,
          endTarget.current,
          eased
        );
        orbitControls.update();
      }
    }
  });

  return null;
};
