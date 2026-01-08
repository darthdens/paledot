// Cosmos Explorer - Solar System visualization
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Sun } from './objects/Sun';
import { Planet } from './objects/Planet';
import { CosmosUI } from './ui/CosmosUI';
import { celestialObjects } from './data/celestialObjects';

export const CosmosExplorer = () => {
  const planets = celestialObjects.filter(obj => obj.type === 'planet' || obj.type === 'dwarf-planet');
  const moons = celestialObjects.filter(obj => obj.type === 'moon');

  return (
    <div className="relative w-full h-full cursor-default" style={{ cursor: 'default' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 5e8, 3e8]} fov={60} near={1} far={1e15} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.5}
            panSpeed={0.8}
            rotateSpeed={0.5}
            minDistance={100}
            maxDistance={1e14}
          />
          
          <ambientLight intensity={0.1} />
          <directionalLight position={[0, 0, 0]} intensity={1.5} />
          
          <Stars radius={1e12} depth={1e11} count={10000} factor={1e9} saturation={0} fade speed={0.5} />
          
          {/* Sun at center */}
          <Sun position={[0, 0, 0]} scale={1} />
          
          {/* All planets */}
          {planets.map(planet => (
            <Planet key={planet.id} object={planet} showOrbit={true} scale={1} />
          ))}
          
          {/* All moons */}
          {moons.map(moon => (
            <Planet key={moon.id} object={moon} showOrbit={false} scale={1} />
          ))}
        </Suspense>
      </Canvas>
      
      <CosmosUI />
    </div>
  );
};
