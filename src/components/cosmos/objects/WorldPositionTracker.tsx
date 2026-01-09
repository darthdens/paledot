import type { PropsWithChildren } from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../store/useCosmosStore';

type WorldPositionTrackerProps = PropsWithChildren<{
  objectId: string;
  /** Scene-space position for the tracked group (recommended for static children with their own local offsets). */
  position?: [number, number, number];
  /** Seconds between position updates (lower = smoother camera follow). */
  updateInterval?: number;
}>;

export const WorldPositionTracker = ({
  objectId,
  position,
  updateInterval = 0.1,
  children,
}: WorldPositionTrackerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const setObjectWorldPosition = useCosmosStore((s) => s.setObjectWorldPosition);

  const accumulator = useRef(0);
  const worldPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    accumulator.current += delta;
    if (accumulator.current < updateInterval) return;
    accumulator.current = 0;

    groupRef.current.getWorldPosition(worldPos.current);
    setObjectWorldPosition(objectId, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
  }, -1);

  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  );
};
