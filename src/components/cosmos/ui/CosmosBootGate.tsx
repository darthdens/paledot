import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface CosmosBootGateProps {
  /** Start warmup/compile only after textures are known to be loaded */
  enabled: boolean;
  /** Called once when the scene has had a couple frames to settle + compile runs */
  onReady: () => void;
  /** Number of frames to wait after enabled before compiling */
  warmupFrames?: number;
}

/**
 * Runs a tiny post-load warmup so heavy CPU work + shader compilation happens behind the loader.
 */
export const CosmosBootGate = ({
  enabled,
  onReady,
  warmupFrames = 2,
}: CosmosBootGateProps) => {
  const { gl, scene, camera } = useThree();
  const frameCount = useRef(0);
  const didSignal = useRef(false);

  useFrame(() => {
    if (!enabled || didSignal.current) return;

    frameCount.current += 1;
    if (frameCount.current < warmupFrames) return;

    try {
      // Compile what’s currently in the scene to reduce “first time” stutters.
      gl.compile(scene, camera);
    } catch {
      // Ignore compile failures; the scene will still render.
    }

    didSignal.current = true;
    onReady();
  });

  return null;
};
