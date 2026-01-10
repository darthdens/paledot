// TexturedPlanet - Renders planets with realistic lighting and shadows
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialObject } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';
import { celestialObjects } from '../data/celestialObjects';

// Import NASA texture maps
import earthDayTexture from '@/assets/textures/earth-day.jpg';
import earthNightTexture from '@/assets/textures/earth-night.jpg';
import earthCloudsTexture from '@/assets/textures/earth-clouds.jpg';
import moonTexture from '@/assets/textures/moon.jpg';
import mercuryTexture from '@/assets/textures/mercury.jpg';
import venusTexture from '@/assets/textures/venus.jpg';
import marsTexture from '@/assets/textures/mars.jpg';
import jupiterTexture from '@/assets/textures/jupiter.jpg';

interface TexturedPlanetProps {
  object: CelestialObject;
  showOrbit?: boolean;
  visualScale?: number;
  distanceScale?: number;
}

// Planet colors and visual properties - based on real NASA imagery
const PLANET_VISUALS: Record<string, {
  baseColor: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness: number;
  metalness: number;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  hasRings?: boolean;
  ringColor?: string;
  ringOpacity?: number;
  ringInnerMult?: number;
  ringOuterMult?: number;
  ringStyle?: 0 | 1;
  tilt?: number;
  hasClouds?: boolean;
  cloudColor?: string;
  surfaceDetail?: 'rocky' | 'gaseous' | 'icy' | 'volcanic' | 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'io' | 'europa' | 'ganymede' | 'callisto' | 'titan' | 'iapetus' | 'triton' | 'enceladus' | 'pluto' | 'ceres';
  uniqueFeature?: string;
}> = {
  sun: {
    baseColor: '#FFF5E0',
    secondaryColor: '#FF8C00',
    tertiaryColor: '#FF4500',
    emissive: '#FF6B00',
    emissiveIntensity: 2.5,
    roughness: 1,
    metalness: 0,
    surfaceDetail: 'sun',
  },
  mercury: {
    baseColor: '#707070',        // Dark gray like the Moon but darker
    secondaryColor: '#505050',   // Even darker craters
    tertiaryColor: '#888888',    // Lighter highlands
    roughness: 0.98,
    metalness: 0.1,
    surfaceDetail: 'mercury',
  },
  venus: {
    baseColor: '#E8E0C8',        // Yellowish-white cloud cover
    secondaryColor: '#D4C8A0',   // Slightly darker cloud bands
    tertiaryColor: '#C0B090',    // Darker swirls
    roughness: 0.3,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#FFF8DC',
    atmosphereIntensity: 1.0,
    hasClouds: true,
    cloudColor: '#F5EED8',
    surfaceDetail: 'venus',
  },
  earth: {
    baseColor: '#0A2463',        // Deep ocean blue (darker, more realistic)
    secondaryColor: '#1B4D1B',   // Forest green land
    tertiaryColor: '#C4A55A',    // Desert/sandy brown
    roughness: 0.25,             // Smoother for ocean specular
    metalness: 0.02,
    hasAtmosphere: true,
    atmosphereColor: '#6BA3D6',  // More realistic atmospheric blue
    atmosphereIntensity: 0.6,
    hasClouds: true,
    cloudColor: '#FFFFFF',
    tilt: 23.4,
    surfaceDetail: 'earth',
  },
  moon: {
    baseColor: '#C8C8C8',        // Bright highlands (lighter)
    secondaryColor: '#3A3A3A',   // Dark maria (basaltic plains)
    tertiaryColor: '#8A8A8A',    // Mid-tone transitional areas
    roughness: 0.95,
    metalness: 0,
    surfaceDetail: 'moon',
  },
  mars: {
    baseColor: '#C1440E',        // Rusty red-orange
    secondaryColor: '#8B2500',   // Darker volcanic regions
    tertiaryColor: '#FFFFFF',    // Polar ice caps
    roughness: 0.9,
    metalness: 0.05,
    hasAtmosphere: true,
    atmosphereColor: '#FFB090',
    atmosphereIntensity: 0.15,
    surfaceDetail: 'mars',
  },
  jupiter: {
    baseColor: '#D8CA9D',        // Creamy tan base
    secondaryColor: '#A59164',   // Brown bands
    tertiaryColor: '#E8DCC0',    // Lighter zones
    roughness: 0.6,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#F5E6D3',
    atmosphereIntensity: 0.3,
    surfaceDetail: 'jupiter',
    uniqueFeature: 'greatRedSpot',
  },
  io: {
    baseColor: '#FFFF00',        // Bright yellow sulfur
    secondaryColor: '#FF6600',   // Orange volcanic deposits
    tertiaryColor: '#CC0000',    // Red volcanic vents
    roughness: 0.7,
    metalness: 0.05,
    surfaceDetail: 'io',
  },
  europa: {
    baseColor: '#F0F8FF',        // Bright white-blue ice
    secondaryColor: '#8B4513',   // Brown ice cracks (lineae)
    tertiaryColor: '#D4C4B0',    // Tan patches
    roughness: 0.2,
    metalness: 0.3,
    surfaceDetail: 'europa',
  },
  ganymede: {
    baseColor: '#A0988C',        // Gray-brown base
    secondaryColor: '#686058',   // Dark ancient terrain
    tertiaryColor: '#B8B0A8',    // Lighter grooved terrain
    roughness: 0.85,
    metalness: 0.1,
    surfaceDetail: 'ganymede',
  },
  callisto: {
    baseColor: '#4B3621',        // Very dark brown base
    secondaryColor: '#2A1A10',   // Even darker
    tertiaryColor: '#E8E8E8',    // Bright white crater impacts
    roughness: 0.95,
    metalness: 0.05,
    surfaceDetail: 'callisto',
  },
  saturn: {
    baseColor: '#F4D7A8',        // Pale gold/butterscotch
    secondaryColor: '#CEBA81',   // Darker gold bands
    tertiaryColor: '#FFF0D8',    // Lighter zones
    roughness: 0.55,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#FFF8E8',
    atmosphereIntensity: 0.35,
    hasRings: true,
    ringColor: '#D4C4A8',
    ringOpacity: 0.85,
    ringInnerMult: 1.25,
    ringOuterMult: 2.3,
    ringStyle: 0,
    tilt: 26.7,
    surfaceDetail: 'saturn',
  },
  titan: {
    baseColor: '#FF8C00',        // Orange haze - completely opaque
    secondaryColor: '#CC7000',   // Darker orange
    tertiaryColor: '#FFB040',    // Lighter orange areas
    roughness: 0.4,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#FFA500',
    atmosphereIntensity: 1.2,    // Very thick - hides surface
    surfaceDetail: 'titan',
  },
  uranus: {
    baseColor: '#AFEEEE',        // Pale cyan/aquamarine
    secondaryColor: '#88D8D8',   // Slightly darker cyan
    tertiaryColor: '#C8F8F8',    // Lighter areas
    roughness: 0.5,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#C8F0F8',
    atmosphereIntensity: 0.35,
    hasRings: true,
    ringColor: '#4A5560',
    ringOpacity: 0.4,
    ringInnerMult: 1.5,
    ringOuterMult: 2.0,
    ringStyle: 1,
    tilt: 97.8,
    surfaceDetail: 'uranus',
  },
  neptune: {
    baseColor: '#4169E1',        // Deep azure blue
    secondaryColor: '#2850B0',   // Darker blue
    tertiaryColor: '#FFFFFF',    // White cirrus clouds
    roughness: 0.5,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#6688FF',
    atmosphereIntensity: 0.45,
    surfaceDetail: 'neptune',
  },
  pluto: {
    baseColor: '#D4C4A8',        // Tan base
    secondaryColor: '#3A3028',   // Dark charcoal regions
    tertiaryColor: '#FFFFFF',    // White heart (Sputnik Planitia)
    roughness: 0.9,
    metalness: 0,
    surfaceDetail: 'pluto',
  },
  // Mars moons - small, dark, potato-shaped
  phobos: {
    baseColor: '#605850',
    secondaryColor: '#403830',
    roughness: 0.98,
    metalness: 0.05,
    surfaceDetail: 'rocky',
  },
  deimos: {
    baseColor: '#706860',
    secondaryColor: '#504840',
    roughness: 0.98,
    metalness: 0.05,
    surfaceDetail: 'rocky',
  },
  ceres: {
    baseColor: '#808080',
    secondaryColor: '#505050',
    tertiaryColor: '#FFFFFF',    // Bright spots (Occator crater)
    roughness: 0.88,
    metalness: 0.1,
    surfaceDetail: 'ceres',
  },
  mimas: {
    baseColor: '#E0E0E0',
    secondaryColor: '#A0A0A0',
    roughness: 0.75,
    metalness: 0.15,
    surfaceDetail: 'icy',
  },
  enceladus: {
    baseColor: '#FFFFFF',        // Brightest object - pure white ice
    secondaryColor: '#E8E8F0',
    tertiaryColor: '#80B0C0',    // Tiger stripe fractures (bluish)
    roughness: 0.15,
    metalness: 0.25,
    surfaceDetail: 'enceladus',
  },
  tethys: {
    baseColor: '#D8D8D8',
    secondaryColor: '#A8A8A8',
    roughness: 0.65,
    metalness: 0.15,
    surfaceDetail: 'icy',
  },
  dione: {
    baseColor: '#C8C8C8',
    secondaryColor: '#888888',
    roughness: 0.7,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  rhea: {
    baseColor: '#D0D0D0',
    secondaryColor: '#909090',
    roughness: 0.8,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  iapetus: {
    baseColor: '#FFFFFF',        // Bright trailing hemisphere
    secondaryColor: '#201008',   // Very dark leading hemisphere
    tertiaryColor: '#808080',    // Transition zone
    roughness: 0.85,
    metalness: 0.05,
    surfaceDetail: 'iapetus',
  },
  miranda: {
    baseColor: '#B8B8B8',
    secondaryColor: '#686868',
    roughness: 0.8,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  ariel: {
    baseColor: '#C8C8C8',
    secondaryColor: '#989898',
    roughness: 0.55,
    metalness: 0.15,
    surfaceDetail: 'icy',
  },
  umbriel: {
    baseColor: '#484848',        // Very dark
    secondaryColor: '#282828',
    roughness: 0.9,
    metalness: 0.05,
    surfaceDetail: 'rocky',
  },
  titania: {
    baseColor: '#A8A8A8',
    secondaryColor: '#787878',
    roughness: 0.75,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  oberon: {
    baseColor: '#908888',        // Gray with red tint
    secondaryColor: '#605858',
    roughness: 0.8,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  triton: {
    baseColor: '#FFE4C4',        // Pinkish-tan nitrogen ice
    secondaryColor: '#D4B896',   // Cantaloupe terrain
    tertiaryColor: '#404040',    // Dark geyser streaks
    roughness: 0.45,
    metalness: 0.15,
    hasAtmosphere: true,
    atmosphereColor: '#FFE8E0',
    atmosphereIntensity: 0.1,
    surfaceDetail: 'triton',
  },
};

export const TexturedPlanet = ({ 
  object, 
  showOrbit = true, 
  visualScale = 80,
  distanceScale = 0.15 
}: TexturedPlanetProps) => {
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const ringMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const worldPos = useRef(new THREE.Vector3());
  const parentPos = useRef(new THREE.Vector3());
  // Throttle world-position writes using real frame time so it still works when timeSpeed is 0 (tour pauses time).
  const worldPosUpdateAccumulator = useRef(0);
  const rotationAngle = useRef(0);
  const simTime = useRef(0);
  const simTimeInitialized = useRef(false);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const selectedObjectId = selectedObject?.id;
  const selectedParentId = selectedObject?.type === 'moon' ? selectedObject.parentId : null;

  const isMoon = !!object.parentId;
  
  // Get parent planet size for shadow calculations (moons only)
  const parentPlanetSize = useMemo(() => {
    if (!isMoon || !object.parentId) return 0;
    // Planet sizes in km - need to match celestialObjects data
    const planetSizes: Record<string, number> = {
      earth: 12742,
      jupiter: 139820,
      saturn: 116460,
    };
    return (planetSizes[object.parentId] || 0) * visualScale;
  }, [isMoon, object.parentId, visualScale]);

  // Load NASA textures for planets
  const earthDayMap = useLoader(THREE.TextureLoader, earthDayTexture);
  const earthNightMap = useLoader(THREE.TextureLoader, earthNightTexture);
  const earthCloudsMap = useLoader(THREE.TextureLoader, earthCloudsTexture);
  const moonMap = useLoader(THREE.TextureLoader, moonTexture);
  const mercuryMap = useLoader(THREE.TextureLoader, mercuryTexture);
  const venusMap = useLoader(THREE.TextureLoader, venusTexture);
  const marsMap = useLoader(THREE.TextureLoader, marsTexture);
  const jupiterMap = useLoader(THREE.TextureLoader, jupiterTexture);
  
  // Configure texture properties for proper spherical mapping
  useMemo(() => {
    [earthDayMap, earthNightMap, earthCloudsMap, moonMap, mercuryMap, venusMap, marsMap, jupiterMap].forEach(tex => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [earthDayMap, earthNightMap, earthCloudsMap, moonMap, mercuryMap, venusMap, marsMap, jupiterMap]);
  
  const visuals = PLANET_VISUALS[object.id] || {
    baseColor: object.color,
    roughness: 0.7,
    metalness: 0.1,
  };
  
  const planetSize = object.size * visualScale;
  const orbitRadius = (object.orbitRadius || 0) * distanceScale;
  const tiltRadians = ((visuals.tilt || 0) * Math.PI) / 180;

  const ringInnerRadius = planetSize * (visuals.ringInnerMult ?? 1.3);
  const ringOuterRadius = planetSize * (visuals.ringOuterMult ?? 2.2);
  const ringStyle = visuals.ringStyle ?? (object.id === 'uranus' ? 1 : 0);

  // For moons, use the real orbit radius scaled into scene units (so orbit paths match motion).
  const moonOrbitRadius = isMoon ? (object.orbitRadius || 0) * distanceScale : 0;

  // Real rotation speeds based on actual sidereal rotation periods
  // Scaled so 1 Earth day = 60 seconds of simulation time at 1x speed for realistic visualization
  const getRotationSpeed = () => {
    // Rotation period in hours (negative = retrograde rotation)
    const rotationPeriodsHours: Record<string, number> = {
      sun: 609.12,        // 25.38 days (equatorial)
      mercury: 1407.6,    // 58.65 days
      venus: -5832.5,     // 243.02 days retrograde
      earth: 23.934,      // 23h 56m 4s
      moon: 655.7,        // 27.32 days (tidally locked)
      mars: 24.623,       // 24h 37m 22s
      jupiter: 9.925,     // 9h 55m 30s (fastest planet)
      io: 42.46,          // 1.77 days (tidally locked)
      europa: 85.23,      // 3.55 days (tidally locked)
      ganymede: 171.71,   // 7.15 days (tidally locked)
      callisto: 400.54,   // 16.69 days (tidally locked)
      saturn: 10.656,     // 10h 39m 22s
      titan: 382.68,      // 15.95 days (tidally locked)
      uranus: -17.24,     // 17h 14m retrograde (tilted axis)
      neptune: 16.11,     // 16h 6m 36s
      pluto: -153.29,     // 6.39 days retrograde
    };
    
    const periodHours = rotationPeriodsHours[object.id] || 24;
    // Scale: 1 Earth day (24h) = 240 seconds at 1x speed (slower for better viewing)
    // radians per second = 2π / (periodHours * 10)
    const radiansPerSecond = (2 * Math.PI) / (Math.abs(periodHours) * 10);
    return periodHours < 0 ? -radiansPerSecond : radiansPerSecond;
  };
  
  const rotationSpeed = getRotationSpeed();


  useFrame((state, delta) => {
    // Use an accumulated simulation time so changing timeSpeed doesn't "jump" positions/lighting.
    if (!simTimeInitialized.current) {
      simTime.current = state.clock.getElapsedTime();
      simTimeInitialized.current = true;
    }
    simTime.current += delta * timeSpeed;
    const time = simTime.current;

    // Planet rotation with accurate real rotation speeds (delta in seconds)
    rotationAngle.current += rotationSpeed * delta * timeSpeed;
    if (planetRef.current) {
      planetRef.current.rotation.y = rotationAngle.current;
    }

    if (!groupRef.current) return;

    // Calculate orbital angular velocity from real orbital period
    // Scale: 1 Earth year (365.25 days) = 240 seconds at 1x speed (slower for better viewing)
    // angular velocity = 2π / (periodDays / 365.25 * 240) = 2π * 365.25 / (periodDays * 240)
    const getOrbitalAngularVelocity = (periodDays: number) => {
      return (2 * Math.PI * 365.25) / (periodDays * 240);
    };

    // Moons: orbit around their parent planet's world position
    // Note: We read parent position directly from store which was updated this frame (planets render first)
    if (isMoon && moonOrbitRadius > 0) {
      const parentPosArr = useCosmosStore.getState().objectWorldPositions[object.parentId!];
      if (parentPosArr) {
        const periodDays = object.orbitPeriodDays || 27.32; // Default to Moon's period
        const orbitalVelocity = getOrbitalAngularVelocity(periodDays);
        const angle = time * orbitalVelocity;
        // Position relative to parent - add orbital offset to parent's world position
        const orbitalX = Math.cos(angle) * moonOrbitRadius;
        const orbitalZ = Math.sin(angle) * moonOrbitRadius;
        groupRef.current.position.x = parentPosArr[0] + orbitalX;
        groupRef.current.position.y = parentPosArr[1];
        groupRef.current.position.z = parentPosArr[2] + orbitalZ;
      } else {
        // Fallback: if parent position not yet available, place at initial position
        // This can happen on the first frame before parent has updated
        const periodDays = object.orbitPeriodDays || 27.32;
        const orbitalVelocity = getOrbitalAngularVelocity(periodDays);
        const angle = time * orbitalVelocity;
        // Use object's initial position as a fallback reference point
        const parentOrbitRadius = (celestialObjects.find(o => o.id === object.parentId)?.orbitRadius || 0) * distanceScale;
        const parentAngle = time * getOrbitalAngularVelocity(
          celestialObjects.find(o => o.id === object.parentId)?.orbitPeriodDays || 365.25
        );
        const estimatedParentX = Math.cos(parentAngle) * parentOrbitRadius;
        const estimatedParentZ = Math.sin(parentAngle) * parentOrbitRadius;
        groupRef.current.position.x = estimatedParentX + Math.cos(angle) * moonOrbitRadius;
        groupRef.current.position.y = 0;
        groupRef.current.position.z = estimatedParentZ + Math.sin(angle) * moonOrbitRadius;
      }
    }
    // Planets: orbit around the Sun (origin) with real Keplerian proportions
    else if (orbitRadius > 0 && !isMoon) {
      const periodDays = object.orbitPeriodDays || 365.25; // Default to Earth's period
      const orbitalVelocity = getOrbitalAngularVelocity(periodDays);
      const angle = time * orbitalVelocity;
      groupRef.current.position.x = Math.cos(angle) * orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * orbitRadius;
    }

    // Now that motion is applied, compute world position and update shader uniforms
    groupRef.current.getWorldPosition(worldPos.current);

    // Get parent position for shadow calculations (moons only)
    if (isMoon && object.parentId) {
      const parentPosArr = useCosmosStore.getState().objectWorldPositions[object.parentId];
      if (parentPosArr) {
        parentPos.current.set(parentPosArr[0], parentPosArr[1], parentPosArr[2]);
      }
    }

    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.time.value = time;
      planetMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      if (isMoon) {
        planetMaterialRef.current.uniforms.parentCenter.value.copy(parentPos.current);
        planetMaterialRef.current.uniforms.parentRadius.value = parentPlanetSize;
      }
    }
    if (cloudMaterialRef.current) {
      cloudMaterialRef.current.uniforms.time.value = time;
      cloudMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      if (isMoon) {
        cloudMaterialRef.current.uniforms.parentCenter.value.copy(parentPos.current);
        cloudMaterialRef.current.uniforms.parentRadius.value = parentPlanetSize;
      }
    }
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      if (isMoon) {
        atmosphereMaterialRef.current.uniforms.parentCenter.value.copy(parentPos.current);
        atmosphereMaterialRef.current.uniforms.parentRadius.value = parentPlanetSize;
      }
    }
    if (ringMaterialRef.current) {
      ringMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      ringMaterialRef.current.uniforms.planetRadius.value = planetSize;
    }

    // Keep a live world-position for camera targeting (planets/moons move).
    // Use frame delta (not simulated time) so positions still update when timeSpeed is 0 during the tour.
    worldPosUpdateAccumulator.current += delta;

    const shouldUpdateNow =
      object.id === selectedObjectId ||
      (selectedParentId && object.id === selectedParentId) ||
      worldPosUpdateAccumulator.current > 0.05;

    if (shouldUpdateNow) {
      worldPosUpdateAccumulator.current = 0;
      setObjectWorldPosition(object.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    }

    // Atmosphere pulse
    if (atmosphereRef.current) {
      const scale = 1 + Math.sin(time * 0.5) * 0.02;
      atmosphereRef.current.scale.setScalar(scale);
    }
  }, -1);

  // Create orbit line (only for planets orbiting sun, not moons) with compressed distances
  const orbitPoints = useMemo(() => {
    if (!showOrbit || orbitRadius === 0 || isMoon) return null;
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        )
      );
    }
    return points;
  }, [orbitRadius, showOrbit, isMoon]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedObject(object);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHoveredObject(object);
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
  };

  // Initial position with distance compression
  const scaledPosition: [number, number, number] = isMoon 
    ? [object.position[0] * distanceScale, object.position[1], object.position[2] * distanceScale]
    : [object.position[0] * distanceScale, object.position[1], object.position[2] * distanceScale];

  return (
    <>
      {/* Orbit line */}
      {orbitPoints && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </line>
      )}

      {/* Planet group */}
      <group ref={groupRef} position={scaledPosition}>
        <group rotation={[tiltRadians, 0, 0]}>
          {/* Main planet sphere with enhanced shader for surface detail */}
          <mesh 
            ref={planetRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <sphereGeometry args={[planetSize, 128, 128]} />
            <shaderMaterial
              ref={planetMaterialRef}
              uniforms={{
                baseColor: { value: new THREE.Color(visuals.baseColor) },
                secondaryColor: { value: new THREE.Color(visuals.secondaryColor || visuals.baseColor) },
                tertiaryColor: { value: new THREE.Color(visuals.tertiaryColor || visuals.secondaryColor || visuals.baseColor) },
                roughness: { value: visuals.roughness },
                metalness: { value: visuals.metalness },
                emissive: { value: new THREE.Color(visuals.emissive || '#000000') },
                emissiveIntensity: { value: visuals.emissiveIntensity || 0 },
                time: { value: 0 },
                surfaceType: { value: 
                  visuals.surfaceDetail === 'sun' ? 1.0 :
                  visuals.surfaceDetail === 'mercury' ? 2.0 :
                  visuals.surfaceDetail === 'venus' ? 3.0 :
                  visuals.surfaceDetail === 'earth' ? 4.0 :
                  visuals.surfaceDetail === 'moon' ? 5.0 :
                  visuals.surfaceDetail === 'mars' ? 6.0 :
                  visuals.surfaceDetail === 'jupiter' ? 7.0 :
                  visuals.surfaceDetail === 'saturn' ? 8.0 :
                  visuals.surfaceDetail === 'uranus' ? 9.0 :
                  visuals.surfaceDetail === 'neptune' ? 10.0 :
                  visuals.surfaceDetail === 'io' ? 11.0 :
                  visuals.surfaceDetail === 'europa' ? 12.0 :
                  visuals.surfaceDetail === 'ganymede' ? 13.0 :
                  visuals.surfaceDetail === 'callisto' ? 14.0 :
                  visuals.surfaceDetail === 'titan' ? 15.0 :
                  visuals.surfaceDetail === 'enceladus' ? 16.0 :
                  visuals.surfaceDetail === 'iapetus' ? 17.0 :
                  visuals.surfaceDetail === 'triton' ? 18.0 :
                  visuals.surfaceDetail === 'pluto' ? 19.0 :
                  visuals.surfaceDetail === 'ceres' ? 20.0 :
                  visuals.surfaceDetail === 'gaseous' ? 50.0 : 
                  visuals.surfaceDetail === 'icy' ? 51.0 : 
                  visuals.surfaceDetail === 'volcanic' ? 52.0 : 
                  visuals.surfaceDetail === 'rocky' ? 53.0 : 0.0 
                },
                planetSeed: { value: object.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 0.1 },
                objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                parentCenter: { value: new THREE.Vector3(0, 0, 0) },
                parentRadius: { value: parentPlanetSize },
                isMoon: { value: isMoon ? 1.0 : 0.0 },
                hasRings: { value: visuals.hasRings ? 1.0 : 0.0 },
                ringInnerRadius: { value: ringInnerRadius },
                ringOuterRadius: { value: ringOuterRadius },
                planetTilt: { value: tiltRadians },
                ringOpacity: { value: visuals.ringOpacity ?? 0.8 },
                ringStyle: { value: ringStyle },
                // NASA texture maps
                earthDayMap: { value: earthDayMap },
                earthNightMap: { value: earthNightMap },
                moonMap: { value: moonMap },
                mercuryMap: { value: mercuryMap },
                venusMap: { value: venusMap },
                marsMap: { value: marsMap },
                jupiterMap: { value: jupiterMap },
              }}
              vertexShader={`
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vWorldCenter;
                
                void main() {
                  vUv = uv;
                  vPosition = position;
                  vNormal = normal;
                  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                  vec4 worldPos = modelMatrix * vec4(position, 1.0);
                  vWorldPosition = worldPos.xyz;
                  vWorldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 baseColor;
                uniform vec3 secondaryColor;
                uniform vec3 tertiaryColor;
                uniform float roughness;
                uniform float metalness;
                uniform vec3 emissive;
                uniform float emissiveIntensity;
                uniform float time;
                uniform float surfaceType;
                uniform float planetSeed;
                uniform vec3 objectCenter;
                uniform vec3 parentCenter;
                uniform float parentRadius;
                uniform float isMoon;
                uniform float hasRings;
                uniform float ringInnerRadius;
                uniform float ringOuterRadius;
                uniform float planetTilt;
                uniform float ringOpacity;
                uniform float ringStyle;
                // NASA texture maps
                uniform sampler2D earthDayMap;
                uniform sampler2D earthNightMap;
                uniform sampler2D moonMap;
                uniform sampler2D mercuryMap;
                uniform sampler2D venusMap;
                uniform sampler2D marsMap;
                uniform sampler2D jupiterMap;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                varying vec3 vWorldCenter;

                // Simple noise function for surface detail
                float hash(vec2 p) {
                  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }
                
                float noise(vec2 p) {
                  vec2 i = floor(p);
                  vec2 f = fract(p);
                  f = f * f * (3.0 - 2.0 * f);
                  
                  float a = hash(i);
                  float b = hash(i + vec2(1.0, 0.0));
                  float c = hash(i + vec2(0.0, 1.0));
                  float d = hash(i + vec2(1.0, 1.0));
                  
                  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                float fbm(vec2 p) {
                  float value = 0.0;
                  float amplitude = 0.5;
                  for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                  }
                  return value;
                }
                
                // Check if point is in shadow of parent planet (for moons)
                float calculateShadow(vec3 fragWorldPos, vec3 sunDir) {
                  if (isMoon < 0.5) return 1.0; // Not a moon, no shadow
                  
                  vec3 toParent = parentCenter - fragWorldPos;
                  float distAlongRay = dot(toParent, sunDir);
                  if (distAlongRay < 0.0) return 1.0;
                  
                  vec3 closestPoint = fragWorldPos + sunDir * distAlongRay;
                  float distFromAxis = length(parentCenter - closestPoint);
                  
                  float shadowRadius = parentRadius;
                  if (distFromAxis < shadowRadius) {
                    return smoothstep(shadowRadius * 0.8, shadowRadius, distFromAxis);
                  }
                  return 1.0;
                }
                
              // Check if point is in shadow of the rings with soft penumbra
                float calculateRingShadow(vec3 fragWorldPos, vec3 sunDir) {
                  // ringStyle=1 (Uranus-like): no visible ring shadow due to extreme tilt + dark narrow rings
                  if (hasRings < 0.5 || ringStyle > 0.5) return 1.0;
                  
                  // Get fragment position relative to planet center
                  vec3 relPos = fragWorldPos - vWorldCenter;
                  
                  // Build rotation matrix for planet tilt around X axis (rings are tilted with planet)
                  // This matches the group rotation: rotation={[tiltRadians, 0, 0]}
                  float cosT = cos(-planetTilt); // Negative to undo the tilt
                  float sinT = sin(-planetTilt);

                  // Transform to ring's local frame (undo X-axis tilt)
                  // Ring plane is XZ in local space after rotation
                  vec3 ringFramePos;
                  ringFramePos.x = relPos.x;
                  ringFramePos.y = relPos.y * cosT - relPos.z * sinT;
                  ringFramePos.z = relPos.y * sinT + relPos.z * cosT;
                  
                  // Transform sun direction to ring frame
                  vec3 ringFrameSunDir;
                  ringFrameSunDir.x = sunDir.x;
                  ringFrameSunDir.y = sunDir.y * cosT - sunDir.z * sinT;
                  ringFrameSunDir.z = sunDir.y * sinT + sunDir.z * cosT;
                  
                  // How aligned the sun is with the ring plane.
                  // When the sun is nearly in the ring plane (edge-on), ring shadows should fade smoothly
                  // rather than abruptly popping off.
                  float sunPlane = abs(ringFrameSunDir.y);
                  float planeFactor = smoothstep(0.0005, 0.02, sunPlane);

                  // Avoid unstable ray-plane intersection when nearly parallel
                  if (sunPlane < 0.0001) return 1.0;
                  
                  float t = -ringFramePos.y / ringFrameSunDir.y;
                  if (t <= 0.0) return 1.0;
                  
                  vec3 hitPoint = ringFramePos + ringFrameSunDir * t;
                  float distFromCenter = length(vec2(hitPoint.x, hitPoint.z));
                  
                  // Check if within ring bounds with penumbra zones
                  float ringWidth = ringOuterRadius - ringInnerRadius;
                  
                  // Calculate penumbra softness - fixed value for stability
                  float penumbraWidth = ringWidth * 0.05;
                  
                  // Soft inner edge
                  float innerShadow = smoothstep(ringInnerRadius - penumbraWidth, ringInnerRadius + penumbraWidth * 0.5, distFromCenter);
                  // Soft outer edge  
                  float outerShadow = 1.0 - smoothstep(ringOuterRadius - penumbraWidth * 0.5, ringOuterRadius + penumbraWidth, distFromCenter);
                  
                  float inRing = innerShadow * outerShadow;
                  
                  if (inRing > 0.001) {
                    float ringPos = (distFromCenter - ringInnerRadius) / ringWidth;
                    
                    // Multi-layer ring density with soft transitions
                    float mainBands = 0.5 + 0.5 * sin(ringPos * 80.0);
                    float fineBands = 0.7 + 0.3 * sin(ringPos * 200.0);
                    float microBands = 0.85 + 0.15 * sin(ringPos * 500.0);
                    
                    // Base density varies across ring
                    float baseDensity = 0.35 + 0.45 * (1.0 - ringPos * 0.5);
                    float ringDensity = baseDensity * mainBands * fineBands * microBands;
                    
                    // Cassini Division - soft gap
                    float cassiniCenter = 0.6;
                    float cassiniWidth = 0.08;
                    float cassiniGap = 1.0 - 0.85 * exp(-pow((ringPos - cassiniCenter) / cassiniWidth, 2.0));
                    ringDensity *= cassiniGap;
                    
                    // Encke Gap (thinner gap in A ring)
                    float enckeGap = 1.0 - 0.5 * exp(-pow((ringPos - 0.82) / 0.02, 2.0));
                    ringDensity *= enckeGap;
                    
                    // Shadow strength combines density, ring coverage, ring opacity, and plane alignment
                    float shadowStrength = ringDensity * inRing * ringOpacity * planeFactor * 0.9;
                    float maxShadow = 0.75 * ringOpacity;
                    
                    return 1.0 - clamp(shadowStrength, 0.0, maxShadow);
                  }
                  return 1.0;
                }
                
                void main() {
                  vec3 worldNormal = normalize(vWorldNormal);
                  // Sun is at origin - use the mesh-derived center for stable sun direction
                  vec3 sunDir = normalize(-vWorldCenter);
                  
                  // For lighting, use per-fragment direction for accurate shading
                  vec3 fragSunDir = normalize(-vWorldPosition);
                  float NdotL = dot(worldNormal, fragSunDir);

                  // Calculate shadows - use planet-center sun direction for ring shadow
                  float moonShadow = calculateShadow(vWorldPosition, fragSunDir);
                  float ringShadow = calculateRingShadow(vWorldPosition, sunDir);
                  float totalShadow = min(moonShadow, ringShadow);
                  
                  float ambient = 0.012;
                  float diffuse = max(NdotL, 0.0) * 0.988 * totalShadow;
                  
                  // Multi-scale noise for rich surface detail - offset by planetSeed for unique patterns
                  vec2 seedOffset = vec2(planetSeed * 7.31, planetSeed * 13.17);
                  vec2 noiseCoord = vUv * 12.0 + seedOffset;
                  float surfaceNoise = fbm(noiseCoord);
                  float fineNoise = fbm(noiseCoord * 4.0 + seedOffset * 2.0);
                  float microNoise = noise(noiseCoord * 25.0 + seedOffset * 3.0);
                  
                  vec3 surfaceColor;
                  
                  // === SUN (1) - Plasma surface with granulation ===
                  if (surfaceType > 0.5 && surfaceType < 1.5) {
                    float granulation = fbm(noiseCoord * 3.0 + time * 0.1);
                    float prominences = smoothstep(0.6, 0.8, fineNoise);
                    surfaceColor = mix(baseColor, secondaryColor, granulation * 0.5);
                    surfaceColor = mix(surfaceColor, tertiaryColor, prominences * 0.3);
                    // Add solar flare effect
                    float flare = smoothstep(0.85, 0.95, surfaceNoise) * 0.4;
                    surfaceColor += vec3(flare, flare * 0.5, 0.0);
                  }
                  // === MERCURY (2) - NASA texture with enhanced craters ===
                  else if (surfaceType > 1.5 && surfaceType < 2.5) {
                    // Sample NASA Mercury texture
                    vec3 mercuryColor = texture2D(mercuryMap, vUv).rgb;
                    
                    // Procedural bump mapping from texture for enhanced crater depth
                    float texelSize = 0.002;
                    float heightC = dot(mercuryColor, vec3(0.299, 0.587, 0.114));
                    float heightL = dot(texture2D(mercuryMap, vUv + vec2(-texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightR = dot(texture2D(mercuryMap, vUv + vec2(texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightU = dot(texture2D(mercuryMap, vUv + vec2(0.0, texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightD = dot(texture2D(mercuryMap, vUv + vec2(0.0, -texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    
                    float bumpStrength = 2.0;
                    vec3 bumpNormal = normalize(vec3(
                      (heightL - heightR) * bumpStrength,
                      (heightD - heightU) * bumpStrength,
                      1.0
                    ));
                    
                    // Apply bump to lighting
                    vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
                    vec3 bitangent = normalize(cross(worldNormal, tangent));
                    vec3 perturbedNormal = normalize(
                      tangent * bumpNormal.x + 
                      bitangent * bumpNormal.y + 
                      worldNormal * bumpNormal.z
                    );
                    
                    // Recalculate lighting with bump
                    float bumpedNdotL = max(dot(perturbedNormal, sunDir), 0.0);
                    
                    // Slightly enhance contrast for more defined craters
                    mercuryColor = pow(mercuryColor, vec3(1.1));
                    
                    surfaceColor = mercuryColor;
                    NdotL = mix(NdotL, bumpedNdotL, 0.7);
                  }
                  // === VENUS (3) - NASA texture with animated cloud bands ===
                  else if (surfaceType > 2.5 && surfaceType < 3.5) {
                    // Animate cloud rotation (Venus has super-rotation of atmosphere)
                    float cloudSpeed = time * 0.015;
                    vec2 animatedUv = vUv;
                    animatedUv.x = fract(animatedUv.x + cloudSpeed);
                    
                    // Sample NASA Venus atmosphere texture
                    vec3 venusColor = texture2D(venusMap, animatedUv).rgb;
                    
                    // Add subtle swirling motion overlay
                    float swirl = sin(vUv.y * 12.0 + time * 0.02 + vUv.x * 5.0) * 0.5 + 0.5;
                    float bands = sin(vUv.y * 20.0 + time * 0.01) * 0.15 + 0.85;
                    
                    // Enhance the yellowish sulfuric haze
                    vec3 sulfurHaze = vec3(1.0, 0.92, 0.7);
                    venusColor = mix(venusColor, venusColor * sulfurHaze, 0.3);
                    
                    // Apply band variation
                    venusColor *= bands;
                    
                    // Add atmospheric scattering at terminator
                    float terminatorZone = smoothstep(-0.1, 0.1, dot(worldNormal, sunDir)) * smoothstep(0.3, 0.1, dot(worldNormal, sunDir));
                    vec3 venusGlow = vec3(1.0, 0.85, 0.5);
                    venusColor += venusGlow * terminatorZone * 0.15;
                    
                    surfaceColor = venusColor;
                  }
                  // === EARTH (4) - NASA texture maps with city lights, auroras, and terminator scattering ===
                  else if (surfaceType > 3.5 && surfaceType < 4.5) {
                    // Sample NASA Earth day texture
                    vec3 dayColor = texture2D(earthDayMap, vUv).rgb;
                    
                    // Sample NASA Earth night texture (city lights) - this texture shows real city locations
                    vec3 nightColor = texture2D(earthNightMap, vUv).rgb;
                    
                    // === PROCEDURAL BUMP MAPPING from texture ===
                    float texelSize = 0.002;
                    float heightC = dot(dayColor, vec3(0.299, 0.587, 0.114));
                    float heightL = dot(texture2D(earthDayMap, vUv + vec2(-texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightR = dot(texture2D(earthDayMap, vUv + vec2(texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightU = dot(texture2D(earthDayMap, vUv + vec2(0.0, texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightD = dot(texture2D(earthDayMap, vUv + vec2(0.0, -texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    
                    float bumpStrength = 1.5;
                    vec3 bumpNormal = normalize(vec3(
                      (heightL - heightR) * bumpStrength,
                      (heightD - heightU) * bumpStrength,
                      1.0
                    ));
                    
                    // Perturb the world normal
                    vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
                    vec3 bitangent = normalize(cross(worldNormal, tangent));
                    vec3 perturbedNormal = normalize(
                      tangent * bumpNormal.x + 
                      bitangent * bumpNormal.y + 
                      worldNormal * bumpNormal.z
                    );
                    
                    // Recalculate lighting with perturbed normal
                    float sunFacing = dot(perturbedNormal, sunDir);
                    float dayNightBlend = smoothstep(-0.15, 0.15, sunFacing);
                    
                    // === ATMOSPHERIC SCATTERING AT TERMINATOR (Sunset/Sunrise colors) ===
                    // The terminator is the day/night boundary where we see orange/red sunset colors
                    float terminatorZone = smoothstep(-0.2, 0.0, sunFacing) * smoothstep(0.25, 0.0, sunFacing);
                    
                    // Rayleigh scattering - red/orange light passes through more atmosphere at terminator
                    vec3 sunsetOrange = vec3(1.0, 0.45, 0.15);
                    vec3 sunsetRed = vec3(0.9, 0.25, 0.1);
                    vec3 sunsetPink = vec3(1.0, 0.5, 0.4);
                    
                    // Mix sunset colors based on how deep into terminator we are
                    float deepTerminator = smoothstep(-0.15, 0.0, sunFacing) * smoothstep(0.1, 0.0, sunFacing);
                    vec3 terminatorColor = mix(sunsetOrange, sunsetRed, deepTerminator);
                    terminatorColor = mix(terminatorColor, sunsetPink, pow(terminatorZone, 2.0) * 0.4);
                    
                    // Apply scattering to the surface (tints land/ocean with sunset colors)
                    float scatterIntensity = terminatorZone * 0.6;
                    vec3 scatteredDayColor = mix(dayColor, dayColor * terminatorColor * 1.5, scatterIntensity);
                    
                    // === OCEAN SPECULAR HIGHLIGHTS ===
                    float redChannel = dayColor.r;
                    float greenChannel = dayColor.g;
                    float blueChannel = dayColor.b;
                    
                    // Ocean mask: areas where blue dominates and it's darker (ocean is dark blue)
                    float oceanMask = smoothstep(0.1, 0.25, blueChannel - redChannel * 0.8) * 
                                      smoothstep(0.05, 0.15, blueChannel - greenChannel * 0.6);
                    
                    // Specular calculation for ocean
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 reflectDir = reflect(-sunDir, perturbedNormal);
                    float specAngle = max(dot(viewDir, reflectDir), 0.0);
                    
                    // Sharp specular for sun reflection on water
                    float oceanSpecular = pow(specAngle, 128.0) * oceanMask * 2.0;
                    // Broader glint
                    float oceanGlint = pow(specAngle, 32.0) * oceanMask * 0.3;
                    
                    // Sunset tints the specular highlights too
                    vec3 specColor = mix(vec3(1.0, 0.98, 0.95), terminatorColor, terminatorZone * 0.5);
                    vec3 specularColor = specColor * (oceanSpecular + oceanGlint);
                    
                    // === ENHANCED CITY LIGHTS from NASA night texture ===
                    // The NASA Earth at Night texture already has accurate city positions
                    float cityBrightness = dot(nightColor, vec3(0.299, 0.587, 0.114));

                    // Boost all city light pixels significantly
                    float cityMask = smoothstep(0.02, 0.12, cityBrightness);
                    
                    // Use gamma correction to bring out dimmer lights
                    vec3 correctedNight = pow(nightColor, vec3(0.55));
                    
                    // Strong brightness multiplier
                    vec3 cityWarmth = vec3(1.0, 0.85, 0.6);
                    vec3 cityLights = correctedNight * 18.0 * cityWarmth;
                    
                    // Extra bloom/glow for bright metropolitan areas
                    float bloomIntensity = pow(cityBrightness, 0.8) * 12.0;
                    cityLights += vec3(1.0, 0.92, 0.75) * bloomIntensity;

                    // Only show city lights on night side with smooth transition
                    float nightSide = 1.0 - dayNightBlend;
                    // Fade in city lights as sun sets
                    float cityFade = smoothstep(0.2, -0.1, sunFacing);
                    cityLights *= cityFade * cityMask;
                    
                    // === AURORA BOREALIS & AUSTRALIS ===
                    float lon = vUv.x * 6.28318;
                    float auroraTime = time * 0.3;
                    
                    // Aurora zones - both poles with smooth transitions
                    float latitudeNorth = (vUv.y - 0.5) * 2.0; // -1 at south, +1 at north
                    float latitudeSouth = -latitudeNorth;
                    
                    // Northern aurora (around 65-75 degrees latitude)
                    float auroraNorthZone = smoothstep(0.55, 0.68, latitudeNorth) * smoothstep(0.88, 0.72, latitudeNorth);
                    // Southern aurora (mirrored)
                    float auroraSouthZone = smoothstep(0.55, 0.68, latitudeSouth) * smoothstep(0.88, 0.72, latitudeSouth);
                    
                    // Multi-layer aurora curtains
                    float curtain1 = sin(lon * 8.0 + auroraTime * 1.2 + sin(lon * 3.0 + auroraTime) * 2.0) * 0.5 + 0.5;
                    float curtain2 = sin(lon * 12.0 - auroraTime * 0.8 + sin(lon * 5.0 - auroraTime * 0.5) * 1.5) * 0.5 + 0.5;
                    float curtain3 = sin(lon * 6.0 + auroraTime * 0.5 + cos(lon * 4.0 + auroraTime * 0.3) * 1.8) * 0.5 + 0.5;
                    
                    float auroraPattern = curtain1 * 0.4 + curtain2 * 0.35 + curtain3 * 0.25;
                    auroraPattern = pow(auroraPattern, 1.5);
                    
                    // Slightly different pattern for south (phase offset)
                    float curtainS1 = sin(lon * 8.0 - auroraTime * 1.1 + sin(lon * 3.0 - auroraTime * 0.9) * 2.0) * 0.5 + 0.5;
                    float curtainS2 = sin(lon * 11.0 + auroraTime * 0.7 + sin(lon * 4.0 + auroraTime * 0.4) * 1.5) * 0.5 + 0.5;
                    float curtainS3 = sin(lon * 7.0 - auroraTime * 0.6 + cos(lon * 5.0 - auroraTime * 0.2) * 1.8) * 0.5 + 0.5;
                    float auroraSouthPattern = curtainS1 * 0.4 + curtainS2 * 0.35 + curtainS3 * 0.25;
                    auroraSouthPattern = pow(auroraSouthPattern, 1.5);
                    
                    // Flickering
                    float flickerN = 0.7 + 0.3 * sin(auroraTime * 4.0 + lon * 2.0);
                    float flickerS = 0.7 + 0.3 * sin(auroraTime * 3.8 - lon * 2.2);
                    
                    // Aurora colors
                    vec3 auroraGreen = vec3(0.2, 1.0, 0.4);
                    vec3 auroraPurple = vec3(0.6, 0.2, 0.9);
                    vec3 auroraPink = vec3(1.0, 0.3, 0.5);
                    vec3 auroraBlue = vec3(0.3, 0.5, 1.0);
                    
                    // Northern aurora colors (more green/purple)
                    float colorMixN = sin(lon * 4.0 + auroraTime * 0.7) * 0.5 + 0.5;
                    vec3 auroraNorthColor = mix(auroraGreen, auroraPurple, colorMixN * 0.4);
                    auroraNorthColor = mix(auroraNorthColor, auroraPink, pow(auroraPattern, 2.0) * 0.3);
                    
                    // Southern aurora colors (slightly more blue/pink variation)
                    float colorMixS = sin(lon * 3.5 - auroraTime * 0.6) * 0.5 + 0.5;
                    vec3 auroraSouthColor = mix(auroraGreen, auroraBlue, colorMixS * 0.3);
                    auroraSouthColor = mix(auroraSouthColor, auroraPink, pow(auroraSouthPattern, 2.0) * 0.35);
                    
                    // Final aurora intensities
                    float auroraNorthIntensity = auroraNorthZone * auroraPattern * flickerN * nightSide * 0.9;
                    float auroraSouthIntensity = auroraSouthZone * auroraSouthPattern * flickerS * nightSide * 0.85;
                    
                    vec3 aurora = auroraNorthColor * auroraNorthIntensity + auroraSouthColor * auroraSouthIntensity;
                    
                    // Apply bump-enhanced lighting to day texture
                    float bumpLighting = max(0.0, dot(perturbedNormal, sunDir));
                    scatteredDayColor *= 0.85 + bumpLighting * 0.3;
                    
                    // === ENSURE MINIMUM DARKNESS ON NIGHT SIDE ===
                    // Prevent sun from bleeding through by ensuring a minimum color on night side
                    // This adds a very subtle ambient from starlight/moonlight
                    vec3 nightAmbient = dayColor * 0.008; // Very dim ambient from texture
                    
                    // Add ocean specular to day side only
                    vec3 dayWithSpecular = scatteredDayColor + specularColor * dayNightBlend;
                    
                    // === TERMINATOR ATMOSPHERIC GLOW ===
                    // Add atmospheric glow at the terminator edge (visible from space)
                    vec3 atmosphericGlow = terminatorColor * terminatorZone * 0.25;
                    
                    // Final blend: night side shows city lights + aurora + ambient, day side shows terrain + specular + scattering
                    vec3 nightSideColor = cityLights + aurora + nightAmbient;
                    surfaceColor = mix(nightSideColor, dayWithSpecular, dayNightBlend);
                    surfaceColor += atmosphericGlow;
                    
                    // Ensure we never go fully black (prevents sun bloom bleed-through)
                    surfaceColor = max(surfaceColor, vec3(0.003));
                  }
                  // === MOON (5) - NASA texture map with bump mapping ===
                  else if (surfaceType > 4.5 && surfaceType < 5.5) {
                    // Sample NASA Moon texture (LROC)
                    vec3 moonColor = texture2D(moonMap, vUv).rgb;
                    
                    // === PROCEDURAL BUMP MAPPING for craters ===
                    float texelSize = 0.003;
                    float heightC = dot(moonColor, vec3(0.299, 0.587, 0.114));
                    float heightL = dot(texture2D(moonMap, vUv + vec2(-texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightR = dot(texture2D(moonMap, vUv + vec2(texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightU = dot(texture2D(moonMap, vUv + vec2(0.0, texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightD = dot(texture2D(moonMap, vUv + vec2(0.0, -texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    
                    // Stronger bump for Moon's cratered surface
                    float bumpStrength = 2.5;
                    vec3 bumpNormal = normalize(vec3(
                      (heightL - heightR) * bumpStrength,
                      (heightD - heightU) * bumpStrength,
                      1.0
                    ));
                    
                    // Perturb the world normal
                    vec3 worldNormal = normalize(vWorldNormal);
                    vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
                    vec3 bitangent = normalize(cross(worldNormal, tangent));
                    vec3 perturbedNormal = normalize(
                      tangent * bumpNormal.x + 
                      bitangent * bumpNormal.y + 
                      worldNormal * bumpNormal.z
                    );
                    
                    // Apply bump-enhanced lighting
                    vec3 sunDir = normalize(-vWorldPosition);
                    float bumpLighting = max(0.0, dot(perturbedNormal, sunDir));
                    
                    // Enhanced crater shadows and highlights
                    surfaceColor = moonColor * (0.7 + bumpLighting * 0.5);
                  }
                  // === MARS (6) - NASA texture with polar ice caps and dust effects ===
                  else if (surfaceType > 5.5 && surfaceType < 6.5) {
                    // Sample NASA Mars texture
                    vec3 marsColor = texture2D(marsMap, vUv).rgb;
                    
                    // Procedural bump mapping for terrain depth
                    float texelSize = 0.002;
                    float heightC = dot(marsColor, vec3(0.299, 0.587, 0.114));
                    float heightL = dot(texture2D(marsMap, vUv + vec2(-texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightR = dot(texture2D(marsMap, vUv + vec2(texelSize, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightU = dot(texture2D(marsMap, vUv + vec2(0.0, texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    float heightD = dot(texture2D(marsMap, vUv + vec2(0.0, -texelSize)).rgb, vec3(0.299, 0.587, 0.114));
                    
                    float bumpStrength = 2.5;
                    vec3 bumpNormal = normalize(vec3(
                      (heightL - heightR) * bumpStrength,
                      (heightD - heightU) * bumpStrength,
                      1.0
                    ));
                    
                    // Apply bump to lighting
                    vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
                    vec3 bitangent = normalize(cross(worldNormal, tangent));
                    vec3 perturbedNormal = normalize(
                      tangent * bumpNormal.x + 
                      bitangent * bumpNormal.y + 
                      worldNormal * bumpNormal.z
                    );
                    
                    float bumpedNdotL = max(dot(perturbedNormal, sunDir), 0.0);
                    
                    // Enhance the rusty red Martian color
                    vec3 marsRed = vec3(1.0, 0.85, 0.75);
                    marsColor = marsColor * marsRed;
                    
                    // Subtle dust haze in atmosphere at terminator
                    float terminatorZone = smoothstep(-0.1, 0.1, dot(worldNormal, sunDir)) * smoothstep(0.3, 0.1, dot(worldNormal, sunDir));
                    vec3 dustHaze = vec3(1.0, 0.7, 0.5);
                    marsColor += dustHaze * terminatorZone * 0.1;
                    
                    surfaceColor = marsColor;
                    NdotL = mix(NdotL, bumpedNdotL, 0.7);
                  }
                  // === JUPITER (7) - NASA texture with animated cloud bands ===
                  else if (surfaceType > 6.5 && surfaceType < 7.5) {
                    // Animate cloud band rotation (differential rotation - equator faster)
                    float lat = vUv.y - 0.5;
                    float differentialSpeed = 0.008 * (1.0 - abs(lat) * 0.4);
                    vec2 animatedUv = vUv;
                    animatedUv.x = fract(animatedUv.x + time * differentialSpeed);
                    
                    // Sample NASA Jupiter texture
                    vec3 jupiterColor = texture2D(jupiterMap, animatedUv).rgb;
                    
                    // Add subtle turbulence to cloud edges
                    float turbulence = sin(vUv.y * 80.0 + time * 0.05 + surfaceNoise * 3.0) * 0.02;
                    vec2 turbUv = animatedUv;
                    turbUv.x = fract(turbUv.x + turbulence);
                    vec3 turbColor = texture2D(jupiterMap, turbUv).rgb;
                    jupiterColor = mix(jupiterColor, turbColor, 0.3);
                    
                    // Enhance the warm tones
                    vec3 warmTint = vec3(1.0, 0.95, 0.9);
                    jupiterColor *= warmTint;
                    
                    // Subtle limb darkening for gas giant atmosphere
                    float limbDarkening = 1.0 - pow(1.0 - abs(dot(worldNormal, normalize(cameraPosition - vWorldPosition))), 0.3) * 0.15;
                    jupiterColor *= limbDarkening;
                    
                    surfaceColor = jupiterColor;
                  }
                  // === SATURN (8) - Pale gold subtle bands ===
                  else if (surfaceType > 7.5 && surfaceType < 8.5) {
                    float lat = vUv.y;
                    float band1 = sin(lat * 18.0) * 0.25 + 0.5;
                    float band2 = sin(lat * 40.0 + 0.3) * 0.15 + 0.5;
                    float bands = band1 * 0.6 + band2 * 0.4 + surfaceNoise * 0.08;
                    surfaceColor = mix(tertiaryColor, secondaryColor, clamp(bands, 0.0, 1.0));
                    surfaceColor = mix(surfaceColor, baseColor, 0.5);
                  }
                  // === URANUS (9) - Pale cyan with very subtle bands ===
                  else if (surfaceType > 8.5 && surfaceType < 9.5) {
                    float lat = vUv.y;
                    float band = sin(lat * 12.0) * 0.1 + 0.5;
                    surfaceColor = mix(baseColor, secondaryColor, band + surfaceNoise * 0.05);
                    surfaceColor = mix(surfaceColor, tertiaryColor, 0.2);
                  }
                  // === NEPTUNE (10) - Deep blue with white clouds ===
                  else if (surfaceType > 9.5 && surfaceType < 10.5) {
                    float lat = vUv.y;
                    float bands = sin(lat * 20.0) * 0.15 + 0.5;
                    surfaceColor = mix(baseColor, secondaryColor, bands + surfaceNoise * 0.1);
                    // White cirrus clouds
                    float clouds = smoothstep(0.7, 0.85, fineNoise) * 0.5;
                    surfaceColor = mix(surfaceColor, tertiaryColor, clouds);
                    // Great Dark Spot
                    vec2 darkSpotCenter = vec2(0.3, 0.4);
                    float darkSpot = 1.0 - smoothstep(0.06, 0.1, length(vUv - darkSpotCenter));
                    surfaceColor = mix(surfaceColor, secondaryColor * 0.7, darkSpot * 0.6);
                  }
                  // === IO (11) - Yellow sulfur with orange/red volcanic spots ===
                  else if (surfaceType > 10.5 && surfaceType < 11.5) {
                    float sulfur = surfaceNoise;
                    float volcanic = smoothstep(0.55, 0.75, fineNoise);
                    float hotSpots = smoothstep(0.7, 0.85, fineNoise);
                    surfaceColor = baseColor; // Yellow
                    surfaceColor = mix(surfaceColor, secondaryColor, volcanic * 0.6); // Orange
                    surfaceColor = mix(surfaceColor, tertiaryColor, hotSpots * 0.4); // Red
                    surfaceColor += vec3(0.25, 0.08, 0.0) * hotSpots; // Glow
                  }
                  // === EUROPA (12) - White ice with brown linear cracks ===
                  else if (surfaceType > 11.5 && surfaceType < 12.5) {
                    float crack1 = smoothstep(0.47, 0.53, sin(vUv.x * 60.0 + vUv.y * 20.0 + surfaceNoise * 3.0));
                    float crack2 = smoothstep(0.47, 0.53, sin(vUv.y * 50.0 - vUv.x * 15.0 + fineNoise * 2.0));
                    float crack3 = smoothstep(0.48, 0.52, sin(vUv.x * 35.0 - vUv.y * 40.0));
                    float cracks = max(max(crack1, crack2), crack3 * 0.5) * 0.55;
                    surfaceColor = baseColor; // White ice
                    surfaceColor = mix(surfaceColor, secondaryColor, cracks); // Brown cracks
                    surfaceColor = mix(surfaceColor, tertiaryColor, microNoise * 0.1);
                  }
                  // === GANYMEDE (13) - Mixed gray/brown with grooved terrain ===
                  else if (surfaceType > 12.5 && surfaceType < 13.5) {
                    float darkTerrain = smoothstep(0.4, 0.6, surfaceNoise);
                    float grooves = sin(vUv.x * 80.0 + vUv.y * 30.0) * 0.5 + 0.5;
                    surfaceColor = mix(secondaryColor, baseColor, darkTerrain);
                    surfaceColor = mix(surfaceColor, tertiaryColor, grooves * darkTerrain * 0.3);
                    surfaceColor *= 1.0 - smoothstep(0.6, 0.7, fineNoise) * 0.2;
                  }
                  // === CALLISTO (14) - Very dark with bright crater impacts ===
                  else if (surfaceType > 13.5 && surfaceType < 14.5) {
                    float craters = smoothstep(0.65, 0.8, fineNoise);
                    surfaceColor = mix(secondaryColor, baseColor, surfaceNoise * 0.3);
                    // Bright impact craters
                    surfaceColor = mix(surfaceColor, tertiaryColor, craters * 0.7);
                  }
                  // === TITAN (15) - Orange haze, no surface visible ===
                  else if (surfaceType > 14.5 && surfaceType < 15.5) {
                    float haze = surfaceNoise * 0.2 + 0.4;
                    surfaceColor = mix(baseColor, secondaryColor, haze);
                    surfaceColor = mix(surfaceColor, tertiaryColor, fineNoise * 0.15);
                  }
                  // === ENCELADUS (16) - Bright white with tiger stripes ===
                  else if (surfaceType > 15.5 && surfaceType < 16.5) {
                    surfaceColor = baseColor; // Pure white
                    surfaceColor = mix(surfaceColor, secondaryColor, microNoise * 0.1);
                    // Tiger stripes at south pole
                    float southPole = smoothstep(0.15, 0.0, vUv.y);
                    float stripes = sin(vUv.x * 40.0 + surfaceNoise * 3.0) * 0.5 + 0.5;
                    surfaceColor = mix(surfaceColor, tertiaryColor, southPole * stripes * 0.6);
                  }
                  // === IAPETUS (17) - Two-toned: bright and dark hemispheres ===
                  else if (surfaceType > 16.5 && surfaceType < 17.5) {
                    // Sharp transition between hemispheres
                    float hemisphere = smoothstep(0.4, 0.6, vUv.x);
                    surfaceColor = mix(secondaryColor, baseColor, hemisphere);
                    surfaceColor = mix(surfaceColor, tertiaryColor, surfaceNoise * 0.15);
                  }
                  // === TRITON (18) - Pinkish with cantaloupe texture and dark streaks ===
                  else if (surfaceType > 17.5 && surfaceType < 18.5) {
                    // Cantaloupe terrain (dimpled appearance)
                    float cantaloupe = sin(noiseCoord.x * 15.0) * sin(noiseCoord.y * 15.0) * 0.5 + 0.5;
                    surfaceColor = mix(baseColor, secondaryColor, cantaloupe * 0.4 + surfaceNoise * 0.3);
                    // Dark geyser streaks
                    float streaks = smoothstep(0.7, 0.85, fineNoise) * 0.5;
                    surfaceColor = mix(surfaceColor, tertiaryColor, streaks);
                  }
                  // === PLUTO (19) - Tan/charcoal with white heart ===
                  else if (surfaceType > 18.5 && surfaceType < 19.5) {
                    float terrain = surfaceNoise * 0.5 + fineNoise * 0.5;
                    float darkRegions = smoothstep(0.4, 0.6, terrain);
                    surfaceColor = mix(baseColor, secondaryColor, darkRegions);
                    // Heart-shaped Sputnik Planitia
                    vec2 heartCenter = vec2(0.4, 0.5);
                    float heartDist = length((vUv - heartCenter) * vec2(1.2, 1.0));
                    float heart = 1.0 - smoothstep(0.12, 0.18, heartDist);
                    surfaceColor = mix(surfaceColor, tertiaryColor, heart * 0.9);
                  }
                  // === CERES (20) - Gray with bright spots ===
                  else if (surfaceType > 19.5 && surfaceType < 20.5) {
                    float craters = 1.0 - smoothstep(0.55, 0.65, surfaceNoise) * 0.3;
                    surfaceColor = mix(baseColor, secondaryColor, fineNoise * 0.4);
                    surfaceColor *= craters;
                    // Bright spots (Occator crater)
                    float brightSpot = smoothstep(0.85, 0.95, fineNoise);
                    surfaceColor = mix(surfaceColor, tertiaryColor, brightSpot * 0.8);
                  }
                  // === Generic gaseous (50) ===
                  else if (surfaceType > 49.5 && surfaceType < 50.5) {
                    float lat = vUv.y;
                    float bands = sin(lat * 30.0) * 0.4 + 0.5 + surfaceNoise * 0.2;
                    surfaceColor = mix(baseColor, secondaryColor, clamp(bands, 0.0, 1.0));
                  }
                  // === Generic icy (51) ===
                  else if (surfaceType > 50.5 && surfaceType < 51.5) {
                    float cracks = smoothstep(0.42, 0.48, fineNoise);
                    float ridges = smoothstep(0.3, 0.35, abs(sin(vUv.x * 80.0 + surfaceNoise * 5.0)));
                    surfaceColor = mix(baseColor, secondaryColor, cracks * 0.5 + ridges * 0.3);
                  }
                  // === Generic volcanic (52) ===
                  else if (surfaceType > 51.5 && surfaceType < 52.5) {
                    float lavaFlow = smoothstep(0.55, 0.75, surfaceNoise);
                    float hotSpots = smoothstep(0.7, 0.85, fineNoise);
                    surfaceColor = mix(baseColor, secondaryColor, lavaFlow * 0.6);
                    surfaceColor += vec3(1.0, 0.3, 0.0) * hotSpots * 0.4;
                  }
                  // === Generic rocky (53) or default ===
                  else {
                    float craters = 1.0 - smoothstep(0.5, 0.6, surfaceNoise) * 0.4;
                    float terrain = fineNoise * 0.3 + microNoise * 0.15;
                    surfaceColor = mix(baseColor, secondaryColor, terrain);
                    surfaceColor *= craters;
                  }
                  
                  vec3 litColor = surfaceColor * (ambient + diffuse);
                  litColor += emissive * emissiveIntensity;
                  
                  if (NdotL > 0.0 && totalShadow > 0.5) {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 halfDir = normalize(fragSunDir + viewDir);
                    float spec = pow(max(dot(worldNormal, halfDir), 0.0), 64.0 / max(roughness, 0.1));
                    litColor += spec * (1.0 - roughness) * 0.3 * max(NdotL, 0.0) * totalShadow;
                  }
                  
                  gl_FragColor = vec4(litColor, 1.0);
                }
              `}
            />
          </mesh>

          {/* Cloud layer for planets with clouds - Earth clouds rotate independently */}
          {visuals.hasClouds && (
            <mesh>
              <sphereGeometry args={[planetSize * 1.02, 64, 64]} />
              <shaderMaterial
                ref={cloudMaterialRef}
                transparent
                depthWrite={false}
                uniforms={{
                  cloudColor: { value: new THREE.Color(visuals.cloudColor || '#ffffff') },
                  time: { value: 0 },
                  objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                  parentCenter: { value: new THREE.Vector3(0, 0, 0) },
                  parentRadius: { value: parentPlanetSize },
                  isMoon: { value: isMoon ? 1.0 : 0.0 },
                  cloudMap: { value: earthCloudsMap },
                  isEarth: { value: object.id === 'earth' ? 1.0 : 0.0 },
                }}
                vertexShader={`
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPosition;
                  varying vec2 vUv;
                  
                  void main() {
                    vUv = uv;
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  uniform vec3 cloudColor;
                  uniform float time;
                  uniform vec3 objectCenter;
                  uniform vec3 parentCenter;
                  uniform float parentRadius;
                  uniform float isMoon;
                  uniform sampler2D cloudMap;
                  uniform float isEarth;
                  
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPosition;
                  varying vec2 vUv;
                  
                  float calculateShadow(vec3 fragWorldPos, vec3 sunDir) {
                    if (isMoon < 0.5) return 1.0;
                    vec3 toParent = parentCenter - fragWorldPos;
                    float distAlongRay = dot(toParent, sunDir);
                    if (distAlongRay < 0.0) return 1.0;
                    vec3 closestPoint = fragWorldPos + sunDir * distAlongRay;
                    float distFromAxis = length(parentCenter - closestPoint);
                    float shadowRadius = parentRadius;
                    if (distFromAxis < shadowRadius) {
                      return smoothstep(shadowRadius * 0.8, shadowRadius, distFromAxis);
                    }
                    return 1.0;
                  }
                  
                  void main() {
                    vec3 worldNormal = normalize(vWorldNormal);
                    vec3 sunDir = normalize(-vWorldPosition);
                    float NdotL = max(dot(worldNormal, sunDir), 0.0);
                    float shadow = calculateShadow(vWorldPosition, sunDir);
                    
                    float cloudCoverage;
                    
                    if (isEarth > 0.5) {
                      // === ANIMATED CLOUD ROTATION ===
                      // Clouds rotate slightly faster than Earth's surface (jet streams)
                      float cloudRotationSpeed = 0.008;
                      float cloudOffset = time * cloudRotationSpeed;
                      
                      // Apply rotation offset to UV (longitude only)
                      vec2 animatedUv = vUv;
                      animatedUv.x = fract(animatedUv.x + cloudOffset);
                      
                      // Sample NASA cloud texture with animated UVs
                      vec3 cloudSample = texture2D(cloudMap, animatedUv).rgb;
                      cloudCoverage = cloudSample.r;
                      
                      // Subtle cloud evolution over time
                      float cloudEvolve = sin(time * 0.02 + vUv.x * 10.0 + vUv.y * 8.0) * 0.08;
                      cloudCoverage = clamp(cloudCoverage + cloudEvolve, 0.0, 1.0);
                    } else {
                      // Procedural clouds for other planets with animation
                      float animatedTime = time * 0.02;
                      vec2 animatedUv = vUv;
                      animatedUv.x = fract(animatedUv.x + animatedTime);
                      float hashVal = fract(sin(dot(animatedUv * 15.0, vec2(127.1, 311.7))) * 43758.5453);
                      cloudCoverage = smoothstep(0.35, 0.65, hashVal);
                    }
                    
                    // === TERMINATOR SCATTERING ON CLOUDS ===
                    // Clouds at the terminator catch sunset/sunrise colors
                    float sunFacing = dot(worldNormal, sunDir);
                    float terminatorZone = smoothstep(-0.2, 0.0, sunFacing) * smoothstep(0.25, 0.0, sunFacing);
                    
                    vec3 sunsetOrange = vec3(1.0, 0.5, 0.2);
                    vec3 cloudWithScatter = mix(cloudColor, sunsetOrange, terminatorZone * 0.4);
                    
                    float lighting = 0.02 + NdotL * 0.98 * shadow;
                    vec3 litCloud = cloudWithScatter * lighting;
                    
                    // Clouds glow slightly at terminator
                    litCloud += sunsetOrange * terminatorZone * 0.15;
                    
                    gl_FragColor = vec4(litCloud, cloudCoverage * 0.6 * max(NdotL, terminatorZone * 0.3) * shadow);
                  }
                `}
              />
            </mesh>
          )}


          {/* Atmosphere glow - enhanced with sun-facing intensity */}
          {visuals.hasAtmosphere && (
            <mesh ref={atmosphereRef}>
              <sphereGeometry args={[planetSize * 1.08, 64, 64]} />
              <shaderMaterial
                ref={atmosphereMaterialRef}
                transparent
                depthWrite={false}
                side={THREE.BackSide}
                uniforms={{
                  glowColor: { value: new THREE.Color(visuals.atmosphereColor || '#4da6ff') },
                  intensity: { value: visuals.atmosphereIntensity || 0.4 },
                  objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                  parentCenter: { value: new THREE.Vector3(0, 0, 0) },
                  parentRadius: { value: parentPlanetSize },
                  isMoon: { value: isMoon ? 1.0 : 0.0 },
                }}
                vertexShader={`
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPosition;
                  void main() {
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPosition;
                  uniform vec3 glowColor;
                  uniform float intensity;
                  uniform vec3 objectCenter;
                  uniform vec3 parentCenter;
                  uniform float parentRadius;
                  uniform float isMoon;
                  
                  float calculateShadow(vec3 fragWorldPos, vec3 sunDir) {
                    if (isMoon < 0.5) return 1.0;
                    vec3 toParent = parentCenter - fragWorldPos;
                    float distAlongRay = dot(toParent, sunDir);
                    if (distAlongRay < 0.0) return 1.0;
                    vec3 closestPoint = fragWorldPos + sunDir * distAlongRay;
                    float distFromAxis = length(parentCenter - closestPoint);
                    if (distFromAxis < parentRadius) {
                      return smoothstep(parentRadius * 0.8, parentRadius, distFromAxis);
                    }
                    return 1.0;
                  }
                  
                  void main() {
                    vec3 worldNormal = normalize(vWorldNormal);
                    vec3 sunDir = normalize(-vWorldPosition);
                    float NdotL = max(dot(worldNormal, sunDir), 0.0);
                    float shadow = calculateShadow(vWorldPosition, sunDir);
                    
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    
                    // Enhanced rim lighting for atmosphere
                    float rim = pow(1.0 - abs(dot(worldNormal, viewDir)), 3.0);
                    
                    // Rayleigh scattering approximation - stronger blue at limb
                    float scattering = pow(1.0 - abs(dot(worldNormal, viewDir)), 4.0);
                    
                    // Sun-facing glow with softer falloff
                    float sunGlow = smoothstep(-0.2, 0.4, NdotL) * shadow;
                    
                    // Terminator glow (visible atmosphere at day/night boundary)
                    float terminator = smoothstep(-0.1, 0.1, NdotL) * smoothstep(0.3, 0.0, NdotL);
                    
                    // Combine effects
                    float totalGlow = (rim * sunGlow + scattering * 0.3 + terminator * 0.15) * intensity;
                    
                    // Color shift towards warmer at terminator (sunset effect)
                    vec3 finalColor = mix(glowColor, vec3(0.9, 0.6, 0.4), terminator * 0.4);
                    
                    gl_FragColor = vec4(finalColor, totalGlow * shadow);
                  }
                `}
              />
            </mesh>
          )}

          {/* Rings (Saturn, Uranus) - enhanced with lighting and planet shadow */}
            {visuals.hasRings && (
              <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
                <ringGeometry args={[ringInnerRadius, ringOuterRadius, 256]} />
                <shaderMaterial
                  ref={ringMaterialRef}
                  transparent
                  depthWrite={false}
                  depthTest={true}
                  polygonOffset={true}
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                  side={THREE.DoubleSide}
                  uniforms={{
                    ringColor: { value: new THREE.Color(visuals.ringColor ?? '#d4b896') },
                    opacity: { value: visuals.ringOpacity ?? 0.7 },
                    ringStyle: { value: ringStyle },
                    innerRadius: { value: ringInnerRadius },
                    outerRadius: { value: ringOuterRadius },
                    objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                    planetRadius: { value: planetSize },
                  }}
                vertexShader={`
                  varying vec2 vUv;
                  varying vec3 vWorldPosition;
                  varying vec3 vWorldNormal;
                  varying vec3 vLocalPosition;
                  varying vec3 vWorldCenter;

                  void main() {
                    vUv = uv;
                    vLocalPosition = position;
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;

                    // Derive center from the mesh transform (prevents 1-frame uniform lag at high timeSpeed)
                    vWorldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                  }
                `}
                fragmentShader={`
                  uniform vec3 ringColor;
                  uniform float opacity;
                  uniform float ringStyle;
                  uniform float innerRadius;
                  uniform float outerRadius;
                  uniform vec3 objectCenter;
                  uniform float planetRadius;
                  
                  varying vec2 vUv;
                  varying vec3 vWorldPosition;
                  varying vec3 vWorldNormal;
                  varying vec3 vLocalPosition;
                  varying vec3 vWorldCenter;
                  
                  // Noise functions for ring detail
                  float hash(float n) { return fract(sin(n) * 43758.5453); }
                  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                  
                  float noise(float x) {
                    float i = floor(x);
                    float f = fract(x);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(hash(i), hash(i + 1.0), f);
                  }
                  
                  float noise2D(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    float a = hash2(i);
                    float b = hash2(i + vec2(1.0, 0.0));
                    float c = hash2(i + vec2(0.0, 1.0));
                    float d = hash2(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                  }
                  
                  float fbm(float x) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 4; i++) {
                      value += amplitude * noise(x);
                      x *= 2.0;
                      amplitude *= 0.5;
                    }
                    return value;
                  }
                  
                  // Check if ring fragment is in shadow of the planet
                  float calculatePlanetShadow(vec3 fragWorldPos, vec3 sunDir) {
                    vec3 toPlanet = vWorldCenter - fragWorldPos;
                    float distAlongRay = dot(toPlanet, sunDir);
                    if (distAlongRay < 0.0) return 1.0;
                    
                    vec3 closestPoint = fragWorldPos + sunDir * distAlongRay;
                    float distFromAxis = length(vWorldCenter - closestPoint);
                    
                    // Soft penumbra based on distance from planet
                    float penumbraSize = planetRadius * 0.15;
                    if (distFromAxis < planetRadius + penumbraSize) {
                      return smoothstep(planetRadius * 0.85, planetRadius + penumbraSize, distFromAxis);
                    }
                    return 1.0;
                  }
                  
                  void main() {
                    vec3 sunDir = normalize(-vWorldPosition);
                    float shadow = calculatePlanetShadow(vWorldPosition, sunDir);

                    vec3 fragFromPlanet = vWorldPosition - vWorldCenter;
                    float distFromPlanet = length(fragFromPlanet);
                    vec3 pseudoNormal = distFromPlanet > 0.001 ? fragFromPlanet / distFromPlanet : vec3(0.0, 1.0, 0.0);
 
                    float NdotLRaw = dot(pseudoNormal, sunDir);
                    float daylight = smoothstep(-0.05, 0.05, NdotLRaw);
                    float NdotL = max(NdotLRaw, 0.0);
                    NdotL = max(NdotL, 0.25 * daylight);

                    float ambient = 0.012;
                    float diffuse = NdotL * 0.988 * shadow;
                    float totalLight = ambient + diffuse;
 
                    // Ring geometry
                    float dist = length(vLocalPosition.xy);
                    float ringWidth = outerRadius - innerRadius;
                    float normalizedDist = (dist - innerRadius) / ringWidth;
                    
                    // Angular position for azimuthal variation
                    float angle = atan(vLocalPosition.y, vLocalPosition.x);
                    
                    // === DETAILED RING STRUCTURE ===
                    
                    // Saturn-like wide rings (A, B, C)
                    float ringA = smoothstep(0.7, 0.72, normalizedDist) * smoothstep(1.0, 0.98, normalizedDist);
                    float ringB = smoothstep(0.35, 0.38, normalizedDist) * smoothstep(0.68, 0.65, normalizedDist);
                    float ringC = smoothstep(0.0, 0.03, normalizedDist) * smoothstep(0.33, 0.30, normalizedDist);
                    
                    float ringADensity = 0.85;
                    float ringBDensity = 1.0;  // B ring is densest
                    float ringCDensity = 0.4;  // C ring is faint
                    
                    // Fine radial structure - moderate frequencies to avoid aliasing/flickering
                    float fineStructure = 0.75 + 0.25 * sin(normalizedDist * 200.0 + fbm(normalizedDist * 30.0) * 1.5);
                    float microStructure = 0.88 + 0.12 * sin(normalizedDist * 600.0);
                    float ultraFine = 0.95 + 0.05 * noise(normalizedDist * 800.0);
                    
                    // Azimuthal variation (spokes and clumps)
                    float azimuthalVar = 0.95 + 0.05 * sin(angle * 30.0 + normalizedDist * 10.0);
                    float spokes = 0.97 + 0.03 * sin(angle * 8.0) * sin(normalizedDist * 20.0);
                    
                    float baseDensitySaturn = ringA * ringADensity + ringB * ringBDensity + ringC * ringCDensity;
                    float ringDensitySaturn = baseDensitySaturn * fineStructure * microStructure * ultraFine * azimuthalVar * spokes;
                    
                    // Saturn gaps
                    float cassiniGap = 1.0 - 0.95 * exp(-pow((normalizedDist - 0.685) / 0.025, 2.0));
                    float enckeGap = 1.0 - 0.8 * exp(-pow((normalizedDist - 0.88) / 0.008, 2.0));
                    float keelerGap = 1.0 - 0.7 * exp(-pow((normalizedDist - 0.96) / 0.004, 2.0));
                    float colomboGap = 1.0 - 0.6 * exp(-pow((normalizedDist - 0.15) / 0.01, 2.0));
                    float maxwellGap = 1.0 - 0.5 * exp(-pow((normalizedDist - 0.22) / 0.008, 2.0));
                    ringDensitySaturn *= cassiniGap * enckeGap * keelerGap * colomboGap * maxwellGap;
                    
                    // Uranus rings based on Voyager 2 data (normalized to our ring geometry)
                    // Uranus radius: 25,559 km, inner ring: 1.4x, outer: 2.1x
                    // Positions calculated as (ringRadius - innerEdge) / ringWidth
                    float uranusBands = 0.0;
                    
                    // Epsilon ring - brightest, widest (19.7-96.4 km width)
                    uranusBands += 1.00 * exp(-pow((normalizedDist - 0.859) / 0.035, 2.0));
                    
                    // Lambda ring - narrow, dusty
                    uranusBands += 0.25 * exp(-pow((normalizedDist - 0.796) / 0.012, 2.0));
                    
                    // Delta ring - narrow with shoulder
                    uranusBands += 0.50 * exp(-pow((normalizedDist - 0.700) / 0.018, 2.0));
                    
                    // Gamma ring - narrow, optically dense
                    uranusBands += 0.55 * exp(-pow((normalizedDist - 0.662) / 0.015, 2.0));
                    
                    // Eta ring - narrow core + wide outer component
                    uranusBands += 0.40 * exp(-pow((normalizedDist - 0.636) / 0.020, 2.0));
                    
                    // Beta ring - eccentric, bright
                    uranusBands += 0.65 * exp(-pow((normalizedDist - 0.552) / 0.018, 2.0));
                    
                    // Alpha ring - eccentric, bright
                    uranusBands += 0.60 * exp(-pow((normalizedDist - 0.499) / 0.016, 2.0));
                    
                    // Inner rings 4, 5, 6 - very narrow
                    uranusBands += 0.30 * exp(-pow((normalizedDist - 0.379) / 0.012, 2.0)); // Ring 4
                    uranusBands += 0.28 * exp(-pow((normalizedDist - 0.360) / 0.012, 2.0)); // Ring 5
                    uranusBands += 0.25 * exp(-pow((normalizedDist - 0.338) / 0.010, 2.0)); // Ring 6
                    
                    float ringDensityUranus = clamp(uranusBands, 0.0, 1.0);
                    ringDensityUranus *= 0.94 + 0.06 * noise(normalizedDist * 400.0);
                    ringDensityUranus *= 0.98 + 0.02 * sin(angle * 6.0);
                    
                    float ringDensity = mix(ringDensitySaturn, ringDensityUranus, ringStyle);

                    // === COLOR VARIATION ===
                    
                    // Saturn-like subtle color variation (redder inner, bluer outer)
                    vec3 innerColor = ringColor * vec3(1.05, 0.98, 0.92);
                    vec3 outerColor = ringColor * vec3(0.95, 0.98, 1.05);
                    vec3 finalColor = mix(innerColor, outerColor, normalizedDist);
                    
                    // B ring has slightly different hue (more golden)
                    vec3 bRingTint = vec3(1.02, 1.0, 0.95);
                    finalColor = mix(finalColor, finalColor * bRingTint, ringB * 0.3);
                    
                    // C ring is darker/grayer
                    vec3 cRingTint = vec3(0.85, 0.85, 0.88);
                    finalColor = mix(finalColor, finalColor * cRingTint, ringC * 0.5);

                    // Uranus rings: very dark, low-color-variation
                    vec3 uranusColor = ringColor * vec3(0.95, 0.98, 1.05);
                    finalColor = mix(finalColor, uranusColor, ringStyle);
                    
                    // Add subtle particle glitter on lit side (mostly Saturn)
                    float glitter = noise2D(vec2(normalizedDist * 500.0, angle * 50.0));
                    glitter = pow(glitter, 8.0) * 0.3 * max(NdotL, 0.0) * (1.0 - ringStyle);
                    finalColor += vec3(glitter);
                    
                    // === OPACITY ===
                    
                    float ringOpacity = opacity * ringDensity;
                    float edgeFade = smoothstep(0.0, 0.05, normalizedDist) * smoothstep(1.0, 0.95, normalizedDist);
                    float alpha = clamp(ringOpacity * edgeFade, 0.0, 0.95);
                    
                    // Lit ring with enhanced brightness
                    float ringBrightness = mix(1.8, 1.8, ringStyle);
                    vec3 litRing = finalColor * totalLight * ringBrightness;
                    
                    gl_FragColor = vec4(litRing, alpha);
                  }
                `}
              />
            </mesh>
          )}
        </group>
      </group>
    </>
  );
};
