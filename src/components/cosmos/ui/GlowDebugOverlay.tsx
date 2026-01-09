import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useCosmosStore } from "../store/useCosmosStore";

/**
 * Debug overlay for glow diagnostics - simplified version.
 */
export const GlowDebugOverlay = () => {
  const { camera } = useThree();
  const centerPos = useCosmosStore((s) => s.objectWorldPositions["milky-way-center"]);
  const currentScale = useCosmosStore((s) => s.currentScale);

  const [debugData, setDebugData] = useState({
    dot: 0,
    centerBehind: false,
    hasCenterPos: false,
  });

  const tmpForward = useRef(new THREE.Vector3());
  const tmpCenterDir = useRef(new THREE.Vector3());

  useFrame(() => {
    camera.getWorldDirection(tmpForward.current);

    if (!centerPos) {
      setDebugData((d) => ({ ...d, hasCenterPos: false }));
      return;
    }

    tmpCenterDir.current
      .set(centerPos[0], centerPos[1], centerPos[2])
      .sub(camera.position)
      .normalize();

    const dot = tmpForward.current.dot(tmpCenterDir.current);
    const centerWorld = new THREE.Vector3(centerPos[0], centerPos[1], centerPos[2]);
    const centerCam = centerWorld.clone().applyMatrix4(camera.matrixWorldInverse);

    setDebugData({
      dot,
      centerBehind: centerCam.z > 0,
      hasCenterPos: true,
    });
  });

  const isGalaxyScale =
    currentScale === "stellar" ||
    currentScale === "milkyWay" ||
    currentScale === "localGroup" ||
    currentScale === "universe";

  return (
    <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.9)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 10,
          padding: 6,
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ color: "#ff0", fontWeight: "bold" }}>🔍 Debug</div>
        <div>Scale: {currentScale} {isGalaxyScale ? "✅" : "❌"}</div>
        <div>Center: {debugData.hasCenterPos ? "✅" : "❌"}</div>
        <div>Dot: <span style={{ color: debugData.dot < 0 ? "#f66" : "#6f6" }}>{debugData.dot.toFixed(3)}</span></div>
        <div>Behind: {debugData.centerBehind ? "YES" : "NO"}</div>
      </div>
    </Html>
  );
};
