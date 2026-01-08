// Cosmos Explorer - Solar System visualization with fly-to navigation
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useMemo, useEffect, useRef } from 'react';
import { Sun } from './objects/Sun';
import { TexturedPlanet } from './objects/TexturedPlanet';
import { MoonOrbit } from './objects/MoonOrbit';
import { OrbitalTrail } from './objects/OrbitalTrail';
import { AsteroidBelt } from './objects/AsteroidBelt';
import { KuiperBelt } from './objects/KuiperBelt';
import { TrojanAsteroids } from './objects/TrojanAsteroids';
import { Comets } from './objects/Comet';
import { MilkyWayGalaxy } from './objects/MilkyWayGalaxy';
import { OortCloud } from './objects/OortCloud';
import { CosmosUI } from './ui/CosmosUI';
import { InfoCard } from './ui/InfoCard';
import { QuickJumpMenu } from './ui/QuickJumpMenu';
import { TourOverlay } from './ui/TourOverlay';
import { PerformanceHUD } from './ui/PerformanceHUD';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts';
import { SizeComparison } from './ui/SizeComparison';
import { ScaleBarUI } from './ui/ScaleBar';
import { YouAreHereLabel } from './ui/YouAreHereLabel';
import { CameraController } from './CameraController';
import { ScaleTracker } from './ScaleTracker';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';
import { useCosmosStore } from './store/useCosmosStore';

// Helper to calculate moon orbit radius
const getMoonOrbitRadius = (moon: typeof celestialObjects[0], distanceScale: number) => {
  if (!moon.parentId) return 0;
  return (moon.orbitRadius || 0) * distanceScale;
};


export const CosmosExplorer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const showOrbits = useCosmosStore(state => state.showOrbits);
  const showTrails = useCosmosStore(state => state.showTrails);
  const isFollowing = useCosmosStore(state => state.isFollowing);
  const currentScale = useCosmosStore(state => state.currentScale);
  
  // Show Milky Way when at stellar or larger scales
  const showMilkyWay = currentScale === 'stellar' || currentScale === 'milkyWay' || currentScale === 'localGroup' || currentScale === 'universe';
  
  // Force cursor none on canvas - OrbitControls tries to set cursor styles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new MutationObserver(() => {
      const canvas = container.querySelector('canvas');
      if (canvas && canvas.style.cursor !== 'none') {
        canvas.style.setProperty('cursor', 'none', 'important');
      }
    });
    
    observer.observe(container, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['style'] 
    });
    
    // Also set immediately
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.setProperty('cursor', 'none', 'important');
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Hide orbits when actively following a moving object (they're distracting)
  const shouldShowOrbits = showOrbits && (!selectedObject || !isFollowing);
  
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
  // Only show orbits for moons of the selected planet (or if a moon of that planet is selected)
  const moonOrbits = useMemo(() => {
    if (!shouldShowOrbits || !selectedObject) return [];

    // Get the parent planet ID to show moon orbits for
    const focusedPlanetId = selectedObject.type === 'moon' 
      ? selectedObject.parentId 
      : selectedObject.type === 'planet' ? selectedObject.id : null;
    
    if (!focusedPlanetId) return [];
    
    return moons
      .filter(moon => moon.parentId === focusedPlanetId)
       .map(moon => ({
         id: moon.id,
         parentId: moon.parentId!,
         orbitRadius: getMoonOrbitRadius(moon, UNIFIED_SCALE),
         color: moon.color,
       }));
  }, [moons, selectedObject, shouldShowOrbits]);

  // Start camera looking at Earth - the natural starting point for exploration
  const earthOrbitRadius = UNITS.KM_PER_AU * UNIFIED_SCALE; // Earth's distance from Sun in scene units
  const earthVisualRadius = 12742 * UNIFIED_SCALE / 2; // Earth's radius in scene units
  const initialCameraPosition: [number, number, number] = [
    earthOrbitRadius + earthVisualRadius * 8,  // Slightly offset from Earth on X
    earthVisualRadius * 4,                      // A bit above Earth
    earthVisualRadius * 10                      // Far enough to see Earth nicely
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Canvas gl={{ alpha: false }}>
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
            maxDistance={1e15}
          />
          
          {/* Camera fly-to controller */}
          <CameraController />
          
          {/* Scale tracker - updates store with current scale level */}
          <ScaleTracker />
          
          {/* Lighting - Sun as primary light source */}
          <ambientLight intensity={0.02} />
          <hemisphereLight args={['#ffffff', '#444466', 0.15]} />
          <pointLight 
            position={[0, 0, 0]} 
            intensity={5} 
            distance={0} 
            decay={1} 
            color="#FFF8E7" 
          />
          
          {/* Star background - scaled down for new coordinate system */}
          <Stars radius={1e8} depth={1e7} count={15000} factor={1e5} saturation={0} fade speed={0.3} />
          
          {/* Milky Way Galaxy - visible at larger scales */}
          {showMilkyWay && (
            <MilkyWayGalaxy visualScale={UNIFIED_SCALE} showYouAreHere={true} />
          )}
          
          {/* The Sun at center - same unified scale as planets */}
          <Sun position={[0, 0, 0]} visualScale={UNIFIED_SCALE} />
          
          {/* Asteroid Belt between Mars and Jupiter */}
          <AsteroidBelt 
            innerRadius={300000000 * UNIFIED_SCALE}
            outerRadius={500000000 * UNIFIED_SCALE}
            count={3500}
            scale={UNIFIED_SCALE}
          />
          
          {/* Jupiter Trojan Asteroids at L4 and L5 */}
          <TrojanAsteroids
            jupiterOrbitRadius={778500000 * UNIFIED_SCALE}
            count={600}
            scale={UNIFIED_SCALE}
          />
          
          {/* Kuiper Belt beyond Neptune */}
          <KuiperBelt
            innerRadius={4500000000 * UNIFIED_SCALE}
            outerRadius={7500000000 * UNIFIED_SCALE}
            count={2000}
            scale={UNIFIED_SCALE}
          />
          
          {/* Oort Cloud - outermost boundary of Solar System */}
          <OortCloud visualScale={UNIFIED_SCALE} />
          
          {/* Famous comets with tails */}
          <Comets scale={UNIFIED_SCALE} />
          
          {/* All planets - using unified scale for both size and distance */}
          {planets.map(planet => (
            <TexturedPlanet 
              key={planet.id} 
              object={planet} 
              showOrbit={shouldShowOrbits} 
              visualScale={UNIFIED_SCALE}
              distanceScale={UNIFIED_SCALE}
            />
          ))}

          {/* Orbital trails for planets */}
          {showTrails && planets.map(planet => (
            <OrbitalTrail
              key={`trail-${planet.id}`}
              objectId={planet.id}
              color={planet.color}
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
              visualScale={UNIFIED_SCALE * 1.5}
              distanceScale={UNIFIED_SCALE}
            />
          ))}
          
          {/* Distant stars - tiny point-like spheres */}
          {stars.map(star => (
            <mesh key={star.id} position={star.position.map(p => p * UNIFIED_SCALE) as [number, number, number]}>
              <sphereGeometry args={[200, 6, 6]} />
              <meshBasicMaterial color={star.color} transparent opacity={0.5} />
            </mesh>
          ))}
          
          {/* Performance stats */}
          <PerformanceHUD />
        </Suspense>
      </Canvas>
      
      {/* UI Overlays */}
      <CosmosUI />
      <TourOverlay />
      <InfoCard />
      <QuickJumpMenu />
      <KeyboardShortcuts />
      <SizeComparison />
      <YouAreHereLabel />
    </div>
  );
};
