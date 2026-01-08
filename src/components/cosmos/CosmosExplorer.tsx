// Cosmos Explorer - Solar System visualization with fly-to navigation
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { Sun } from './objects/Sun';
import { TexturedPlanet } from './objects/TexturedPlanet';
import { MoonOrbit } from './objects/MoonOrbit';
import { CosmosUI } from './ui/CosmosUI';
import { InfoCard } from './ui/InfoCard';
import { QuickJumpMenu } from './ui/QuickJumpMenu';
import { CameraController } from './CameraController';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';

// Helper to calculate moon orbit radius (same logic as in TexturedPlanet)
const getMoonOrbitRadius = (moon: typeof celestialObjects[0], visualScale: number) => {
  if (!moon.parentId) return 0;
  const parentSize = moon.parentId === 'earth' ? 12742 : 
                     moon.parentId === 'jupiter' ? 139820 :
                     moon.parentId === 'saturn' ? 116460 : 50000;
  const parentVisualSize = parentSize * visualScale;
  const realOrbitRadius = moon.orbitRadius || 0;
  const baseOrbitMultiplier = 2 + (realOrbitRadius / 2000000);
  return parentVisualSize * Math.min(baseOrbitMultiplier, 5);
};

export const CosmosExplorer = () => {
  const planets = celestialObjects.filter(obj => 
    obj.type === 'planet' || obj.type === 'dwarf-planet'
  );
  const moons = celestialObjects.filter(obj => obj.type === 'moon');
  const stars = celestialObjects.filter(obj => obj.type === 'star' && obj.id !== 'sun');

  // Visual scale factor - applied consistently to all bodies
  // This makes objects visible while maintaining relative proportions
  const VISUAL_SCALE = 80;
  
  // Distance compression factor - compresses orbital distances to make navigation practical
  // Real distances would make planets invisible specks
  const DISTANCE_SCALE = 0.15;

  // Pre-calculate moon orbit data for orbit visualization
  const moonOrbits = useMemo(() => {
    return moons.map(moon => ({
      id: moon.id,
      parentId: moon.parentId!,
      orbitRadius: getMoonOrbitRadius(moon, VISUAL_SCALE * 1.5),
      color: moon.color,
    }));
  }, [moons]);

  // Start camera looking at inner solar system
  const initialCameraPosition: [number, number, number] = [
    UNITS.KM_PER_AU * DISTANCE_SCALE * 2,
    UNITS.KM_PER_AU * DISTANCE_SCALE * 1.5,
    UNITS.KM_PER_AU * DISTANCE_SCALE * 2.5
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
          
          {/* The Sun at center - same visual scale as planets */}
          <Sun position={[0, 0, 0]} visualScale={VISUAL_SCALE} />
          
          {/* All planets */}
          {planets.map(planet => (
            <TexturedPlanet 
              key={planet.id} 
              object={planet} 
              showOrbit={true} 
              visualScale={VISUAL_SCALE}
              distanceScale={DISTANCE_SCALE}
            />
          ))}
          
          {/* Moon orbit paths - faint circles around parent planets */}
          {moonOrbits.map(orbit => (
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
              visualScale={VISUAL_SCALE * 1.5}
              distanceScale={DISTANCE_SCALE}
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
