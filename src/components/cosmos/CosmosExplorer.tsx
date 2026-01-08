// Cosmos Explorer - Solar System visualization with fly-to navigation
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { Sun } from './objects/Sun';
import { TexturedPlanet } from './objects/TexturedPlanet';
import { CosmosUI } from './ui/CosmosUI';
import { InfoCard } from './ui/InfoCard';
import { QuickJumpMenu } from './ui/QuickJumpMenu';
import { CameraController } from './CameraController';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';
import * as THREE from 'three';

export const CosmosExplorer = () => {
  const planets = celestialObjects.filter(obj => 
    obj.type === 'planet' || obj.type === 'dwarf-planet'
  );
  const moons = celestialObjects.filter(obj => obj.type === 'moon');
  const stars = celestialObjects.filter(obj => obj.type === 'star' && obj.id !== 'sun');

  // Start camera looking at inner solar system
  const initialCameraPosition: [number, number, number] = [
    UNITS.KM_PER_AU * 0.5,
    UNITS.KM_PER_AU * 0.8,
    UNITS.KM_PER_AU * 1.2
  ];

  return (
    <div className="relative w-full h-full cursor-default" style={{ cursor: 'default' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={initialCameraPosition} 
            fov={60} 
            near={1000} 
            far={1e18} 
          />
          <OrbitControls
            makeDefault
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={2}
            panSpeed={1}
            rotateSpeed={0.5}
            minDistance={10000}
            maxDistance={1e16}
          />
          
          {/* Camera fly-to controller */}
          <CameraController />
          
          {/* Lighting */}
          <ambientLight intensity={0.08} />
          <pointLight position={[0, 0, 0]} intensity={3} distance={UNITS.KM_PER_AU * 50} decay={0.5} color="#FFF5E1" />
          
          {/* Star background */}
          <Stars radius={1e14} depth={1e13} count={15000} factor={1e11} saturation={0} fade speed={0.3} />
          
          {/* The Sun at center */}
          <Sun position={[0, 0, 0]} scale={0.5} />
          
          {/* All planets */}
          {planets.map(planet => (
            <TexturedPlanet 
              key={planet.id} 
              object={planet} 
              showOrbit={true} 
              visualScale={300}
            />
          ))}
          
          {/* All moons */}
          {moons.map(moon => (
            <TexturedPlanet 
              key={moon.id} 
              object={moon} 
              showOrbit={false} 
              visualScale={400}
            />
          ))}
          
          {/* Distant stars (very simplified) */}
          {stars.map(star => (
            <mesh key={star.id} position={star.position}>
              <sphereGeometry args={[star.size * 0.001, 16, 16]} />
              <meshBasicMaterial color={star.color} />
            </mesh>
          ))}
        </Suspense>
      </Canvas>
      
      {/* UI Overlays */}
      <CosmosUI />
      <InfoCard />
      <QuickJumpMenu />
    </div>
  );
};
