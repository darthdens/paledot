import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

// Tracks whether the Milky Way center is behind the camera, and exposes a
// lightweight intensity value to the DOM overlay via a window global.
export const GalacticBackGlowTracker = () => {
  const { camera } = useThree();
  const currentScale = useCosmosStore((s) => s.currentScale);
  const getObjectWorldPosition = useCosmosStore((s) => s.getObjectWorldPosition);

  const forward = new THREE.Vector3();
  const toCenter = new THREE.Vector3();

  useFrame(() => {
    const showMilkyWay =
      currentScale === "stellar" ||
      currentScale === "milkyWay" ||
      currentScale === "localGroup" ||
      currentScale === "universe";

    if (!showMilkyWay) {
      (window as any).__galacticBackGlow = 0;
      return;
    }

    const center = getObjectWorldPosition("milkyWay_center") ?? [0, 0, 0];

    camera.getWorldDirection(forward);
    toCenter.set(center[0] - camera.position.x, center[1] - camera.position.y, center[2] - camera.position.z);
    if (toCenter.lengthSq() < 1e-12) {
      (window as any).__galacticBackGlow = 0;
      return;
    }
    toCenter.normalize();

    const d = forward.dot(toCenter); // 1 = looking at center, -1 = center behind camera

    // Only show the overlay when the center is behind the camera.
    // A gentle curve keeps it subtle.
    const behind = Math.max(0, -d);
    const intensity = Math.min(1, Math.pow(behind, 1.6)) * 0.9;

    (window as any).__galacticBackGlow = intensity;
  });

  return null;
};

export const GalacticBackGlowOverlay = () => {
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = (window as any).__galacticBackGlow ?? 0;
      setIntensity(typeof v === "number" ? v : 0);
    }, 100);

    return () => window.clearInterval(id);
  }, []);

  if (intensity <= 0.001) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        opacity: intensity,
        // A soft ring-like glow ("backlight") so you still feel the galaxy glow even when looking away.
        background:
          "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(80,100,220,0.14) 78%, rgba(255,180,40,0.08) 92%, rgba(0,0,0,0) 100%)",
        mixBlendMode: "screen",
      }}
    />
  );
};
