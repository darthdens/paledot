import { useMemo } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';
import { Sun } from './Sun';
import { AsteroidBelt } from './AsteroidBelt';
import { TrojanAsteroids } from './TrojanAsteroids';
import { KuiperBelt } from './KuiperBelt';
import { OortCloud } from './OortCloud';
import { Comets } from './Comet';
import { TexturedPlanet } from './TexturedPlanet';
import { OrbitalTrail } from './OrbitalTrail';
import { MoonOrbit } from './MoonOrbit';
import { celestialObjects } from '../data/celestialObjects';

interface SolarSystemContentProps {
  visualScale: number;
  showOrbits: boolean;
  showTrails: boolean;
  selectedObject: typeof celestialObjects[0] | null;
}

/**
 * Renders all solar system content (Sun, planets, moons, asteroids, comets, etc.)
 * Only visible when in Sun's star system or at galaxy scale (not when in Proxima's system)
 */
export const SolarSystemContent = ({
  visualScale,
  showOrbits,
  showTrails,
  selectedObject,
}: SolarSystemContentProps) => {
  const currentStarSystem = useCosmosStore((s) => s.currentStarSystem);
  
  // Hide solar system details when we're in Proxima's system
  const isInProximaSystem = currentStarSystem === 'proxima-centauri';
  
  const planets = useMemo(() => 
    celestialObjects.filter(obj => obj.type === 'planet' || obj.type === 'dwarf-planet'),
    []
  );
  
  const moons = useMemo(() => 
    celestialObjects.filter(obj => obj.type === 'moon'),
    []
  );
  
  // Pre-calculate moon orbit data for orbit visualization
  const moonOrbits = useMemo(() => {
    if (!showOrbits || !selectedObject) return [];

    const focusedPlanetId = selectedObject.type === 'moon' 
      ? selectedObject.parentId 
      : selectedObject.type === 'planet' ? selectedObject.id : null;
    
    if (!focusedPlanetId) return [];
    
    return moons
      .filter(moon => moon.parentId === focusedPlanetId)
      .map(moon => ({
        id: moon.id,
        parentId: moon.parentId!,
        orbitRadius: (moon.orbitRadius || 0) * visualScale,
        color: moon.color,
      }));
  }, [moons, selectedObject, showOrbits, visualScale]);

  // Don't render anything if we're in Proxima's system
  if (isInProximaSystem) return null;
  
  return (
    <>
      {/* The Sun at center */}
      <Sun position={[0, 0, 0]} visualScale={visualScale} />
      
      {/* Asteroid Belt between Mars and Jupiter */}
      <AsteroidBelt 
        innerRadius={300000000 * visualScale}
        outerRadius={500000000 * visualScale}
        count={3500}
        scale={visualScale}
      />
      
      {/* Jupiter Trojan Asteroids at L4 and L5 */}
      <TrojanAsteroids
        jupiterOrbitRadius={778500000 * visualScale}
        count={600}
        scale={visualScale}
      />
      
      {/* Kuiper Belt beyond Neptune */}
      <KuiperBelt
        innerRadius={4500000000 * visualScale}
        outerRadius={7500000000 * visualScale}
        count={2000}
        scale={visualScale}
      />
      
      {/* Oort Cloud - outermost boundary of Solar System - click to select Sun */}
      <OortCloud visualScale={visualScale} parentStarId="sun" />
      
      {/* Famous comets with tails */}
      <Comets scale={visualScale} />
      
      {/* All planets - using unified scale for both size and distance */}
      {planets.map(planet => (
        <TexturedPlanet 
          key={planet.id} 
          object={planet} 
          showOrbit={showOrbits} 
          visualScale={visualScale}
          distanceScale={visualScale}
        />
      ))}

      {/* Orbital trails for planets */}
      {planets.map((planet) => (
        <OrbitalTrail
          key={`trail-${planet.id}`}
          objectId={planet.id}
          color={planet.color}
          enabled={showTrails}
          maxPoints={120}
          opacity={0.35}
        />
      ))}

      {/* Moon orbit paths - faint circles around parent planets */}
      {showOrbits && moonOrbits.map(orbit => (
        <MoonOrbit
          key={`orbit-${orbit.id}`}
          parentId={orbit.parentId}
          moonOrbitRadius={orbit.orbitRadius}
          color={orbit.color}
        />
      ))}

      {/* All moons */}
      {moons.map(moon => (
        <TexturedPlanet 
          key={moon.id} 
          object={moon} 
          showOrbit={false} 
          visualScale={visualScale * 1.5}
          distanceScale={visualScale}
        />
      ))}
    </>
  );
};