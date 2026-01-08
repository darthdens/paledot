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

  // Unified scale factor - same for objects AND distances to maintain true proportions
  // Sun diameter: 1,392,700 km, Mercury orbit: 57.9M km (0.39 AU)
  // Real ratio: Mercury orbits at ~83 Sun radii - we preserve this exactly
  const UNIFIED_SCALE = 0.001; // Makes Sun radius = ~696 units, Mercury orbit = ~5,790 units

  // Pre-calculate moon orbit data for orbit visualization
  const moonOrbits = useMemo(() => {
    return moons.map(moon => ({
      id: moon.id,
      parentId: moon.parentId!,
      orbitRadius: getMoonOrbitRadius(moon, UNIFIED_SCALE * 1.5),
      color: moon.color,
    }));
  }, [moons]);

  // Start camera looking at inner solar system - positioned to see Sun and inner planets
  const sunRadius = 1392700 * UNIFIED_SCALE / 2; // Sun's radius in scene units
  const initialCameraPosition: [number, number, number] = [
    sunRadius * 10,  // 10 sun radii away on X
    sunRadius * 5,   // 5 sun radii up on Y
    sunRadius * 15   // 15 sun radii away on Z
  ];

  return (
    <div className="relative w-full h-full cursor-default" style={{ cursor: 'default' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={initialCameraPosition} 
            fov={60} 
            near={0.1} 
            far={1e12} 
          />
          <OrbitControls
            makeDefault
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={2}
            panSpeed={1}
            rotateSpeed={0.5}
            minDistance={1}
            maxDistance={1e10}
          />
          
          {/* Camera fly-to controller */}
          <CameraController />
          
          {/* Lighting */}
          <ambientLight intensity={0.08} />
          <pointLight position={[0, 0, 0]} intensity={3} distance={UNITS.KM_PER_AU * UNIFIED_SCALE * 50} decay={0.5} color="#FFF5E1" />
          
          {/* Star background - scaled down for new coordinate system */}
          <Stars radius={1e8} depth={1e7} count={15000} factor={1e5} saturation={0} fade speed={0.3} />
          
          {/* The Sun at center - same unified scale as planets */}
          <Sun position={[0, 0, 0]} visualScale={UNIFIED_SCALE} />
          
          {/* All planets - using unified scale for both size and distance */}
          {planets.map(planet => (
            <TexturedPlanet 
              key={planet.id} 
              object={planet} 
              showOrbit={true} 
              visualScale={UNIFIED_SCALE}
              distanceScale={UNIFIED_SCALE}
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
              visualScale={UNIFIED_SCALE * 1.5}
              distanceScale={UNIFIED_SCALE}
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
