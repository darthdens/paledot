import { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import { UNITS } from '../types';
import { getObjectById } from '../data/celestialObjects';
import { WorldPositionTracker } from './WorldPositionTracker';
import { OortCloud } from './OortCloud';
import { ProximaCentauri } from './ProximaCentauri';
import { useCosmosStore } from '../store/useCosmosStore';

interface ProximaSystemProps {
  visualScale: number;
  updateInterval?: number;
  showOortCloud?: boolean;
}

/**
 * Proxima Centauri as a full "star system" container:
 * - tracked with WorldPositionTracker (stable camera targeting during galaxy rotation)
 * - contains an Oort Cloud shell like the Solar System
 * - has its own local Stars background (visible when zoomed in)
 * - Only visible when in Proxima's system or at galaxy scale (not when in Sun's system)
 */
export const ProximaSystem = ({
  visualScale,
  updateInterval = 0.15,
  showOortCloud = true,
}: ProximaSystemProps) => {
  const currentStarSystem = useCosmosStore((s) => s.currentStarSystem);
  
  const proxima = getObjectById('proxima-centauri');
  if (!proxima) return null;

  // Hide Proxima's internal details (star, local stars background) when we're in the Sun's system
  // But always show the Oort Cloud at galaxy scale for click targeting
  const isInSunSystem = currentStarSystem === 'sun';
  const showFullDetails = !isInSunSystem;
  
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
      {/* Only show Proxima's local details when NOT in Sun's system */}
      {showFullDetails && (
        <>
          {/* Local star background - reduced size/brightness */}
          <Stars 
            radius={1e8} 
            depth={1e7} 
            count={8000} 
            factor={2000} 
            saturation={0} 
            fade 
            speed={0.1} 
          />
          
          <ProximaCentauri visualScale={visualScale} />
        </>
      )}
      
      {/* Oort Cloud - always rendered, handles its own visibility for click targeting at galaxy scale */}
      {showOortCloud && <OortCloud visualScale={visualScale} parentStarId="proxima-centauri" />}
      </group>
    </WorldPositionTracker>
  );
};