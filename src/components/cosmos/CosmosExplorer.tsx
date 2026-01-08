// Cosmos Explorer - Solar System visualization
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Sun } from './objects/Sun';
import { Planet } from './objects/Planet';
import { CosmosUI } from './ui/CosmosUI';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';

// Visual scale multiplier to make planets visible (real scale makes them too tiny)
const PLANET_VISUAL_SCALE = 200;
const MOON_VISUAL_SCALE = 300;

export const CosmosExplorer = () => {
  const planets = celestialObjects.filter(obj => obj.type === 'planet' || obj.type === 'dwarf-planet');
  const moons = celestialObjects.filter(obj => obj.type === 'moon');

  // Camera starts near Earth, looking at the Sun
  const earthDistance = UNITS.KM_PER_AU;

  return (
    <div className="relative w-full h-full cursor-default" style={{ cursor: 'default' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={[earthDistance, earthDistance * 0.3, earthDistance * 0.5]} 
            fov={60} 
            near={100} 
            far={1e15} 
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.5}
            panSpeed={0.8}
            rotateSpeed={0.5}
            minDistance={1000}
            maxDistance={1e14}
            target={[earthDistance * 0.5, 0, 0]}
          />
          
          <ambientLight intensity={0.15} />
          
          <Stars radius={1e12} depth={1e11} count={10000} factor={1e9} saturation={0} fade speed={0.5} />
          
          {/* Sun at center */}
          <Sun position={[0, 0, 0]} scale={0.1} />
          
          {/* All planets with visual scale boost */}
          {planets.map(planet => (
            <Planet key={planet.id} object={planet} showOrbit={true} scale={PLANET_VISUAL_SCALE} />
          ))}
          
          {/* All moons with visual scale boost */}
          {moons.map(moon => (
            <Planet key={moon.id} object={moon} showOrbit={false} scale={MOON_VISUAL_SCALE} />
          ))}
        </Suspense>
      </Canvas>
      
      <CosmosUI />
    </div>
  );
};
