// Cosmos Explorer - Solar System visualization with fly-to navigation
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import { ProximaSystem } from './objects/ProximaSystem';
import { MilkyWayGalaxy } from './objects/MilkyWayGalaxy';
import { AndromedaGalaxy } from './objects/AndromedaGalaxy';
import { TriangulumGalaxy } from './objects/TriangulumGalaxy';
import { WhirlpoolGalaxy } from './objects/WhirlpoolGalaxy';
import { SombreroGalaxy } from './objects/SombreroGalaxy';
import { GalaxySkyGlow } from './objects/GalaxySkyGlow';
import { GalaxyRotator } from './objects/GalaxyRotator';
import { GalaxyFadeWrapper } from './GalaxyFadeWrapper';
import { WorldPositionTracker } from './objects/WorldPositionTracker';
import { SolarSystemTracker } from './objects/SolarSystemTracker';
import { SolarSystemContent } from './objects/SolarSystemContent';
import { GalacticOrbitRing } from './objects/GalacticOrbitRing';
import { Nebula } from './objects/Nebula';
import { CosmosUI } from './ui/CosmosUI';
import { InfoCard } from './ui/InfoCard';
import { QuickJumpMenu } from './ui/QuickJumpMenu';
import { TourOverlay } from './ui/TourOverlay';
import { PerformanceHUD } from './ui/PerformanceHUD';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts';
import { SizeComparison } from './ui/SizeComparison';
import { YouAreHereLabel } from './ui/YouAreHereLabel';
import { CameraController } from './CameraController';
import { ScaleTracker } from './ScaleTracker';
import { StarSystemTracker } from './StarSystemTracker';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';
import { useCosmosStore } from './store/useCosmosStore';

export const CosmosExplorer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const showOrbits = useCosmosStore(state => state.showOrbits);
  const showTrails = useCosmosStore(state => state.showTrails);
  const currentScale = useCosmosStore(state => state.currentScale);
  
  // Hide distant galaxies when within solar system or Proxima Centauri system
  const showDistantGalaxies = currentScale !== 'earth' && currentScale !== 'solarSystem' && currentScale !== 'stellar';
  
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
  
  const stars = celestialObjects.filter(obj => obj.type === 'star' && obj.id !== 'sun' && obj.id !== 'proxima-centauri');
  const nebulae = celestialObjects.filter(obj => obj.type === 'nebula');

  // Unified scale factor - same for objects AND distances to maintain true proportions
  // Sun diameter: 1,392,700 km, Mercury orbit: 57.9M km (0.39 AU)
  // Real ratio: Mercury orbits at ~83 Sun radii - we preserve this exactly
  const UNIFIED_SCALE = 0.001; // Makes Sun radius = ~696 units, Mercury orbit = ~5,790 units

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
            maxDistance={1e18}
          />
          
          {/* Camera fly-to controller */}
          <CameraController />
          
          {/* Scale tracker - updates store with current scale level */}
          <ScaleTracker />
          
          {/* Star system tracker - detects when zoomed into any star system */}
          <StarSystemTracker />
          
          {/* Lighting - ambient stays outside, Sun light goes inside rotator */}
          <ambientLight intensity={0.02} />
          <hemisphereLight args={['#ffffff', '#444466', 0.15]} />
          
          {/* Galactic ambient glow (screen-space background; always present) */}
          <GalaxySkyGlow />

          {/* Everything that should rotate together at galaxy scale */}
          <GalaxyRotator visualScale={UNIFIED_SCALE}>
            {/* Star background - rotates with the rest so the view never "sticks" to it */}
            <Stars radius={1e8} depth={1e7} count={15000} factor={1e5} saturation={0} fade speed={0.3} />

            {/* Galaxy content with smooth fade transition */}
            <GalaxyFadeWrapper>
              {/* Milky Way Galaxy */}
              <MilkyWayGalaxy visualScale={UNIFIED_SCALE} showYouAreHere={true} />
            </GalaxyFadeWrapper>
            
            {/* Sun's light - moves with the solar system */}
            <pointLight 
              position={[0, 0, 0]} 
              intensity={5} 
              distance={0} 
              decay={1} 
              color="#FFF8E7" 
            />
            
            {/* Track solar system position for camera following at all scales */}
            <SolarSystemTracker />
            
            {/* Solar System Content - hidden when in Proxima's system */}
            <SolarSystemContent 
              visualScale={UNIFIED_SCALE}
              showOrbits={showOrbits}
              showTrails={showTrails}
              selectedObject={selectedObject}
            />
            
            {/* Distant stars - tiny point-like spheres */}
            {stars.map((star) => {
              const starPos = star.position.map((p) => p * UNIFIED_SCALE) as [number, number, number];
              return (
                <WorldPositionTracker key={star.id} objectId={star.id} position={starPos} updateInterval={0.15}>
                  <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[200, 6, 6]} />
                    <meshBasicMaterial color={star.color} transparent opacity={0.5} />
                  </mesh>
                </WorldPositionTracker>
              );
            })}
            
            {/* Proxima Centauri system - hidden when in Sun's system */}
            <ProximaSystem visualScale={UNIFIED_SCALE} />

            {/* Nebulae and galactic orbit ring - fade with galaxy */}
            <GalaxyFadeWrapper>
              {nebulae.map((nebula) => (
                <Nebula
                  key={nebula.id}
                  nebula={nebula}
                  visualScale={UNIFIED_SCALE}
                />
              ))}
              
              {/* Galactic orbit ring - hidden when in any star system */}
              {showOrbits && <GalacticOrbitRing visualScale={UNIFIED_SCALE} />}
            </GalaxyFadeWrapper>
          </GalaxyRotator>
          
          {/* Distant Galaxies - OUTSIDE the GalaxyRotator so they don't rotate with Milky Way */}
          {/* Hidden when within solar system or Proxima Centauri system for performance */}
          {showDistantGalaxies && (
            <>
              <AndromedaGalaxy visualScale={UNIFIED_SCALE} />
              <TriangulumGalaxy visualScale={UNIFIED_SCALE} />
              <WhirlpoolGalaxy visualScale={UNIFIED_SCALE} />
              <SombreroGalaxy visualScale={UNIFIED_SCALE} />
            </>
          )}
          
          {/* Bloom post-processing - ultra high threshold for Sun/Proxima only */}
          <EffectComposer>
            <Bloom 
              intensity={0.4}
              luminanceThreshold={6.0}
              luminanceSmoothing={0.05}
              mipmapBlur
            />
          </EffectComposer>
          
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