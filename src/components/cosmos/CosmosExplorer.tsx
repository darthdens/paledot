import { bodyRadius, portraitFramingFactor } from '@/features/left-behind/lib/bodyScale';
// Cosmos Explorer - Solar System visualization with fly-to navigation
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, SelectiveBloom, Selection } from '@react-three/postprocessing';
import { DimStars } from './objects/DimStars';
import { Suspense, lazy, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { ProximaSystem } from './objects/ProximaSystem';
import { MilkyWayGalaxy } from './objects/MilkyWayGalaxy';
import { AndromedaGalaxy } from './objects/AndromedaGalaxy';
import { TriangulumGalaxy } from './objects/TriangulumGalaxy';
import { WhirlpoolGalaxy } from './objects/WhirlpoolGalaxy';
import { SombreroGalaxy } from './objects/SombreroGalaxy';
import { LocalGroupDwarfGalaxies } from './objects/LocalGroupDwarfGalaxies';
import { VirgoSupercluster } from './objects/VirgoSupercluster';
import { Laniakea } from './objects/Laniakea';
import { CosmicWeb } from './objects/CosmicWeb';
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
import { CosmosLoader } from './ui/CosmosLoader';
import { CameraController } from './CameraController';
import { ScaleTracker } from './ScaleTracker';
import { StarSystemTracker } from './StarSystemTracker';
import { celestialObjects } from './data/celestialObjects';
import { UNITS } from './types';
import { useCosmosStore } from './store/useCosmosStore';
import { useGalaxyTimeManager } from './objects/DifferentialRotationMaterial';
import { CosmosBootGate } from './ui/CosmosBootGate';
import { preloadAllRelief } from './lib/relief';
import { preloadHdSurfaces } from './lib/hdSurfaces';
import { useSiteBrand } from '@/lib/site-brand';
import { SimulationClock } from '@/features/left-behind/scene/SimulationClock';
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';
const LeftBehindLayer = lazy(() => import('@/features/left-behind/scene/LeftBehindLayer').then(m => ({ default: m.LeftBehindLayer })));
const HardwareReadout = lazy(() => import('@/features/left-behind/ui/HardwareReadout').then(m => ({ default: m.HardwareReadout })));

// Allow loaders (R3F + our preload) to reuse texture requests.
THREE.Cache.enabled = true;

// Component to manage galaxy rotation time globally (called once)
const GalaxyTimeManager = () => {
  useGalaxyTimeManager();
  return null;
};

export const CosmosExplorer = () => {
  const brand = useSiteBrand();
  const machinesVisible = useLeftBehindStore(s => s.machinesVisible);
  const menuOpen = useLeftBehindStore(s => s.menuOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  // We separate "textures are loaded" vs "scene is warmed up" so the loader can actually
  // hide all the heavy work (geometry generation + shader compilation).
  const [texturesReady, setTexturesReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [skippedLoading, setSkippedLoading] = useState(false);
  // Real terrain height maps load during the opening screen so flying close never stalls; Skip keeps loading them in the background.
  const [reliefLoaded, setReliefLoaded] = useState(false);
  useEffect(() => { let on = true; Promise.all([preloadAllRelief(), preloadHdSurfaces()]).then(() => { if (on) setReliefLoaded(true); }); return () => { on = false; }; }, []);

  const selectedObject = useCosmosStore((state) => state.selectedObject);
  const showOrbits = useCosmosStore((state) => state.showOrbits);
  const showTrails = useCosmosStore((state) => state.showTrails);
  const currentScale = useCosmosStore((state) => state.currentScale);

  const handleTexturesReady = useCallback(() => setTexturesReady(true), []);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  // Handle skip loading - enter cosmos immediately, continue loading in background
  const handleSkipLoading = useCallback(() => {
    setSkippedLoading(true);
    setShowLoader(false);
  }, []);

  const bootDone = (texturesReady && sceneReady && reliefLoaded) || skippedLoading;
  const initialHomeSet = useRef(false);
  useEffect(() => {
    if (!sceneReady || initialHomeSet.current) return;
    initialHomeSet.current = true;
    useCosmosStore.getState().goHome();
  }, [sceneReady]);
  useEffect(() => {
    if (brand !== 'paledot' || !bootDone || !menuOpen) return;
    useCosmosStore.getState().setShowControlHints(false);
  }, [brand, bootDone, menuOpen]);

  // Hide distant galaxies when within solar system or Proxima Centauri system
  const showDistantGalaxies =
    currentScale !== 'earth' && currentScale !== 'solarSystem' && currentScale !== 'stellar';

  // Force cursor none on canvas - OrbitControls tries to set cursor styles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Pale Dot uses the normal system pointer: undo any inline "none" and don't enforce it.
    if (document.documentElement.hasAttribute('data-pd-cursor') || container.closest('.paledot')) {
      const c = container.querySelector('canvas');
      if (c) c.style.removeProperty('cursor');
      return;
    }


    const observer = new MutationObserver(() => {
      const canvas = container.querySelector('canvas');
      if (canvas && canvas.style.cursor !== 'none') {
        canvas.style.setProperty('cursor', 'none', 'important');
      }
    });

    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style'],
    });

    // Also set immediately
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.setProperty('cursor', 'none', 'important');
    }

    return () => observer.disconnect();
  }, []);

  const stars = useMemo(
    () => celestialObjects.filter((obj) => obj.type === 'star' && obj.id !== 'sun' && obj.id !== 'proxima-centauri'),
    []
  );
  const nebulae = useMemo(() => celestialObjects.filter((obj) => obj.type === 'nebula'), []);

  // Unified scale factor - same for objects AND distances to maintain true proportions
  // Sun diameter: 1,392,700 km, Mercury orbit: 57.9M km (0.39 AU)
  // Real ratio: Mercury orbits at ~83 Sun radii - we preserve this exactly
  const UNIFIED_SCALE = 0.001; // Makes Sun radius = ~696 units, Mercury orbit = ~5,790 units

  // Start camera looking at Earth - the natural starting point for exploration
  const earthOrbitRadius = UNITS.KM_PER_AU * UNIFIED_SCALE; // Earth's distance from Sun in scene units
  const earthVisualRadius = bodyRadius(12742);
  const initialFraming = portraitFramingFactor(typeof window === 'undefined' ? 1 : window.innerWidth / window.innerHeight); // Earth's radius in scene units
  const initialCameraPosition: [number, number, number] = [
    earthOrbitRadius + earthVisualRadius * 4 * initialFraming, // Slightly offset from Earth on X
    earthVisualRadius * 2 * initialFraming, // A bit above Earth
    earthVisualRadius * 5 * initialFraming, // Far enough to see Earth nicely
  ];

  return (
    <div ref={containerRef} data-explorer-ui-root className="relative w-full h-full">
      {/* Loading screen */}
      {showLoader && (
        <CosmosLoader
          onTexturesComplete={handleTexturesReady}
          dismiss={texturesReady && sceneReady && reliefLoaded}
          onDismissed={() => setShowLoader(false)}
          onSkip={handleSkipLoading}
        />
      )}

      {/* Keep the scene mounted immediately so heavy work happens behind the loader */}
      <Canvas gl={{ alpha: false }}>
        <Suspense fallback={null}>
          <Selection>
            <PerspectiveCamera makeDefault position={initialCameraPosition} fov={60} near={0.1} far={1e12} />
            <OrbitControls
              makeDefault
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              zoomSpeed={2}
              panSpeed={1}
              rotateSpeed={0.5}
              minDistance={0.001}
              target={[earthOrbitRadius, 0, 0]}
              maxDistance={1e21}
            />

            {/* Camera fly-to controller */}
            <SimulationClock />
            <CameraController />

            {/* Scale tracker - updates store with current scale level */}
            <ScaleTracker />

            {/* Star system tracker - detects when zoomed into any star system */}
            <StarSystemTracker />

            {/* Warmup gate: once textures are loaded, wait a couple frames + compile */}
            <CosmosBootGate enabled={texturesReady} onReady={handleSceneReady} warmupFrames={2} />

            {/* Lighting - ambient stays outside, Sun light goes inside rotator */}
            <ambientLight intensity={0.02} />
            <hemisphereLight args={['#ffffff', '#444466', 0.15]} />

            {/* Galactic ambient glow (screen-space background; always present) */}
            <GalaxySkyGlow />

            {/* Global galaxy time manager - called once to update rotation time */}
            <GalaxyTimeManager />

            {/* Milky Way Galaxy + orbital ring-3 are anchored to the galactic center (they should NOT orbit around the Sun) */}
            <GalaxyFadeWrapper>
              <MilkyWayGalaxy visualScale={UNIFIED_SCALE} showYouAreHere={true} />
              {showOrbits && <GalacticOrbitRing visualScale={UNIFIED_SCALE} />}
            </GalaxyFadeWrapper>

            {/* Everything that should orbit around the Milky Way center */}
            <GalaxyRotator visualScale={UNIFIED_SCALE}>
              {/* Star particles - custom (dimmer than drei Stars) */}
              <DimStars
                radius={1e8}
                depth={1e7}
                count={9000}
                factor={2}
                saturation={0}
                fade
                speed={0.3}
                opacity={0.08}
                blending="normal"
              />

              {/* Sun's light - moves with the solar system */}
              <pointLight position={[0, 0, 0]} intensity={5} distance={0} decay={1} color="#FFF6EC" />

              {/* Track solar system position for camera following at all scales */}
              <SolarSystemTracker />

              {/* Solar System Content - hidden when in Proxima's system */}
              <SolarSystemContent
                visualScale={UNIFIED_SCALE}
                showOrbits={showOrbits}
                showTrails={showTrails}
                selectedObject={selectedObject}
              />
              {brand === 'paledot' && bootDone && machinesVisible && <Suspense fallback={null}><LeftBehindLayer /></Suspense>}

              {/* Distant stars - tiny point-like spheres (very dim) */}
              {stars.map((star) => {
                const starPos = star.position.map((p) => p * UNIFIED_SCALE) as [number, number, number];
                return (
                  <WorldPositionTracker key={star.id} objectId={star.id} position={starPos} updateInterval={0.15}>
                    <mesh position={[0, 0, 0]}>
                      <sphereGeometry args={[80, 6, 6]} />
                      <meshBasicMaterial color={star.color} transparent opacity={0.08} />
                    </mesh>
                  </WorldPositionTracker>
                );
              })}

              {/* Proxima Centauri system - hidden when in Sun's system */}
              <ProximaSystem visualScale={UNIFIED_SCALE} />

              {/* Nebulae - fade with galaxy */}
              <GalaxyFadeWrapper>
                {nebulae.map((nebula) => (
                  <Nebula key={nebula.id} nebula={nebula} visualScale={UNIFIED_SCALE} />
                ))}
              </GalaxyFadeWrapper>
            </GalaxyRotator>

            {/* Distant Galaxies - keep mounted so geometry is built during loader; only render when needed */}
            <group visible={showDistantGalaxies}>
              <AndromedaGalaxy visualScale={UNIFIED_SCALE} />
              <TriangulumGalaxy visualScale={UNIFIED_SCALE} />
              <WhirlpoolGalaxy visualScale={UNIFIED_SCALE} />
              <SombreroGalaxy visualScale={UNIFIED_SCALE} />
              {/* Local Group dwarf galaxies - ~80 procedural satellites */}
              <LocalGroupDwarfGalaxies visualScale={UNIFIED_SCALE} />
            </group>

            {/* Virgo Supercluster - visible at supercluster scale (~110 Mly diameter) */}
            <VirgoSupercluster visualScale={UNIFIED_SCALE} />

            {/* Laniakea - visible at Laniakea scale (~520 Mly diameter) */}
            <Laniakea visualScale={UNIFIED_SCALE} />

            {/* Cosmic Web - large-scale structure with filaments */}
            <CosmicWeb visualScale={UNIFIED_SCALE} />

            {/* Bloom post-processing - disabled (was making galaxies look overexposed) */}
            <EffectComposer>
              <SelectiveBloom intensity={0} luminanceThreshold={999} luminanceSmoothing={0} />
            </EffectComposer>

            {/* Performance stats */}
            <PerformanceHUD />
          </Selection>
        </Suspense>
      </Canvas>

      {/* UI Overlays - only after boot completes */}
      {bootDone && (
        <>
          <CosmosUI />
          <TourOverlay />
          <InfoCard />
          <QuickJumpMenu />
          <KeyboardShortcuts />
          <SizeComparison />
          <YouAreHereLabel />
          {brand === 'paledot' && machinesVisible && <Suspense fallback={null}><HardwareReadout /></Suspense>}
        </>
      )}
    </div>
  );
};
