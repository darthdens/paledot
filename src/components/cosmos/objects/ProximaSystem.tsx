import { useMemo } from 'react';
import { UNITS } from '../types';
import { getObjectById } from '../data/celestialObjects';
import { WorldPositionTracker } from './WorldPositionTracker';
import { OortCloud } from './OortCloud';
import { ProximaCentauri } from './ProximaCentauri';

interface ProximaSystemProps {
  visualScale: number;
  updateInterval?: number;
  showOortCloud?: boolean;
}

/**
 * Proxima Centauri as a full "star system" container:
 * - tracked with WorldPositionTracker (stable camera targeting during galaxy rotation)
 * - contains an Oort Cloud shell like the Solar System
 */
export const ProximaSystem = ({
  visualScale,
  updateInterval = 0.15,
  showOortCloud = true,
}: ProximaSystemProps) => {
  const proxima = getObjectById('proxima-centauri');
  if (!proxima) return null;

  // Stars are stored in light-years in celestialObjects; convert to scene units.
  const gs = UNITS.KM_PER_LY * visualScale;

  const position = useMemo<[number, number, number]>(
    () => [proxima.position[0] * gs, proxima.position[1] * gs, proxima.position[2] * gs],
    [gs, proxima.position]
  );

  return (
    <WorldPositionTracker objectId={proxima.id} position={position} updateInterval={updateInterval}>
      {/* Local star system space (0,0,0) */}
      <group>
        <ProximaCentauri visualScale={visualScale} />
        {showOortCloud && <OortCloud visualScale={visualScale} />}
      </group>
    </WorldPositionTracker>
  );
};
