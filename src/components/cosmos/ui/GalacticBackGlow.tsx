import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";
import { ScaleLevel } from "../types";

// Color gradients matching the galaxy: yellow (close) → orange → purple → blue (far)
const getGlowColorsForScale = (scale: ScaleLevel) => {
  switch (scale) {
    case "stellar":
      // Closer to solar system - warm yellow/orange
      return {
        inner: "rgba(255, 200, 60, 0.18)",
        mid: "rgba(255, 140, 40, 0.12)",
        outer: "rgba(255, 100, 30, 0.06)",
      };
    case "milkyWay":
      // Mid-range - orange/purple blend
      return {
        inner: "rgba(220, 120, 80, 0.16)",
        mid: "rgba(160, 80, 160, 0.12)",
        outer: "rgba(120, 80, 200, 0.08)",
      };
    case "localGroup":
      // Farther out - purple/blue
      return {
        inner: "rgba(140, 80, 180, 0.14)",
        mid: "rgba(100, 90, 200, 0.1)",
        outer: "rgba(60, 80, 180, 0.06)",
      };
    case "universe":
      // Very far - deep blue
      return {
        inner: "rgba(80, 100, 220, 0.12)",
        mid: "rgba(50, 80, 200, 0.08)",
        outer: "rgba(30, 60, 160, 0.04)",
      };
    default:
      return {
        inner: "rgba(255, 180, 60, 0.15)",
        mid: "rgba(180, 100, 160, 0.1)",
        outer: "rgba(80, 100, 220, 0.06)",
      };
  }
};

// Tracks whether the Milky Way center is behind the camera, and exposes a
// lightweight intensity value + scale to the DOM overlay via window globals.
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
      (window as any).__galacticBackGlowScale = null;
      return;
    }

    const center = getObjectWorldPosition("milkyWay_center") ?? [0, 0, 0];

    camera.getWorldDirection(forward);
    toCenter.set(center[0] - camera.position.x, center[1] - camera.position.y, center[2] - camera.position.z);
    if (toCenter.lengthSq() < 1e-12) {
      (window as any).__galacticBackGlow = 0;
      (window as any).__galacticBackGlowScale = null;
      return;
    }
    toCenter.normalize();

    const d = forward.dot(toCenter); // 1 = looking at center, -1 = center behind camera

    // Only show the overlay when the center is behind the camera.
    const behind = Math.max(0, -d);
    const intensity = Math.min(1, Math.pow(behind, 1.6)) * 0.9;

    (window as any).__galacticBackGlow = intensity;
    (window as any).__galacticBackGlowScale = currentScale;
  });

  return null;
};

export const GalacticBackGlowOverlay = () => {
  const [intensity, setIntensity] = useState(0);
  const [scale, setScale] = useState<ScaleLevel | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = (window as any).__galacticBackGlow ?? 0;
      const s = (window as any).__galacticBackGlowScale ?? null;
      setIntensity(typeof v === "number" ? v : 0);
      setScale(s);
    }, 100);

    return () => window.clearInterval(id);
  }, []);

  if (intensity <= 0.001 || !scale) return null;

  const colors = getGlowColorsForScale(scale);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        opacity: intensity,
        background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, ${colors.inner} 65%, ${colors.mid} 80%, ${colors.outer} 92%, rgba(0,0,0,0) 100%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};
