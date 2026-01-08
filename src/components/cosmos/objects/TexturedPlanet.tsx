// TexturedPlanet - Renders planets with realistic lighting and shadows
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialObject } from '../types';
import { useCosmosStore } from '../store/useCosmosStore';

interface TexturedPlanetProps {
  object: CelestialObject;
  showOrbit?: boolean;
  visualScale?: number;
  distanceScale?: number;
}

// Planet colors and visual properties - enhanced for realism
const PLANET_VISUALS: Record<string, {
  baseColor: string;
  secondaryColor?: string;
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
  tilt?: number;
  hasClouds?: boolean;
  cloudColor?: string;
  surfaceDetail?: 'rocky' | 'gaseous' | 'icy' | 'volcanic';
}> = {
  sun: {
    baseColor: '#FDB813',
    emissive: '#FF6600',
    emissiveIntensity: 2,
    roughness: 1,
    metalness: 0,
  },
  mercury: {
    baseColor: '#9d8b7a',
    secondaryColor: '#6b5d4f',
    roughness: 0.95,
    metalness: 0.15,
    surfaceDetail: 'rocky',
  },
  venus: {
    baseColor: '#e8c86e',
    secondaryColor: '#c9a94f',
    roughness: 0.6,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#f5e0a0',
    atmosphereIntensity: 0.7,
    hasClouds: true,
    cloudColor: '#fffbe8',
  },
  earth: {
    baseColor: '#6b93d6',
    secondaryColor: '#4a7c59',
    roughness: 0.4,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#88c0ff',
    atmosphereIntensity: 0.5,
    hasClouds: true,
    cloudColor: '#ffffff',
    tilt: 23.4,
  },
  moon: {
    baseColor: '#c8c8c8',
    secondaryColor: '#8a8a8a',
    roughness: 0.98,
    metalness: 0,
    surfaceDetail: 'rocky',
  },
  mars: {
    baseColor: '#c1440e',
    secondaryColor: '#8b3a0e',
    roughness: 0.85,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#e8a87c',
    atmosphereIntensity: 0.25,
    surfaceDetail: 'rocky',
  },
  jupiter: {
    baseColor: '#d8ca9d',
    secondaryColor: '#c4a574',
    roughness: 0.5,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#f0e6d2',
    atmosphereIntensity: 0.4,
    surfaceDetail: 'gaseous',
  },
  io: {
    baseColor: '#f5d742',
    secondaryColor: '#e85d04',
    roughness: 0.75,
    metalness: 0.1,
    surfaceDetail: 'volcanic',
  },
  europa: {
    baseColor: '#d4cfc0',
    secondaryColor: '#a89f90',
    roughness: 0.4,
    metalness: 0.25,
    surfaceDetail: 'icy',
  },
  ganymede: {
    baseColor: '#a0a0a0',
    secondaryColor: '#707070',
    roughness: 0.8,
    metalness: 0.1,
    surfaceDetail: 'icy',
  },
  callisto: {
    baseColor: '#5a5a5a',
    secondaryColor: '#3a3a3a',
    roughness: 0.92,
    metalness: 0.05,
    surfaceDetail: 'rocky',
  },
  saturn: {
    baseColor: '#f4d59e',
    secondaryColor: '#d4b87a',
    roughness: 0.5,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#fff5e0',
    atmosphereIntensity: 0.35,
    hasRings: true,
    ringColor: '#c9b896',
    ringOpacity: 0.8,
    tilt: 26.7,
    surfaceDetail: 'gaseous',
  },
  titan: {
    baseColor: '#e8a43c',
    secondaryColor: '#c07830',
    roughness: 0.7,
    metalness: 0,
    hasAtmosphere: true,
    atmosphereColor: '#ffcc66',
    atmosphereIntensity: 0.8,
  },
  uranus: {
    baseColor: '#b8e4e4',
    secondaryColor: '#7ec8c8',
    roughness: 0.5,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#c8f0f0',
    atmosphereIntensity: 0.4,
    hasRings: true,
    ringColor: '#a0c8c8',
    ringOpacity: 0.5,
    tilt: 97.8,
    surfaceDetail: 'gaseous',
  },
  neptune: {
    baseColor: '#5b5ddf',
    secondaryColor: '#3d3faf',
    roughness: 0.5,
    metalness: 0.1,
    hasAtmosphere: true,
    atmosphereColor: '#8888ff',
    atmosphereIntensity: 0.5,
    surfaceDetail: 'gaseous',
  },
  pluto: {
    baseColor: '#c4b49a',
    secondaryColor: '#8a7a6a',
    roughness: 0.9,
    metalness: 0,
    surfaceDetail: 'icy',
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
  const lastWorldPosUpdate = useRef(0);
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

  // Ensure we have an initial world position early (helps camera fly-to be accurate immediately)
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPos.current);
    setObjectWorldPosition(object.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id, setObjectWorldPosition]);
  
  const visuals = PLANET_VISUALS[object.id] || {
    baseColor: object.color,
    roughness: 0.7,
    metalness: 0.1,
  };
  
  const planetSize = object.size * visualScale;
  const orbitRadius = (object.orbitRadius || 0) * distanceScale;
  const tiltRadians = ((visuals.tilt || 0) * Math.PI) / 180;

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
    // Scale: 1 Earth day (24h) = 60 seconds at 1x speed
    // radians per second = 2π / (periodHours * 2.5)
    const radiansPerSecond = (2 * Math.PI) / (Math.abs(periodHours) * 2.5);
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
    // Scale: 1 Earth year (365.25 days) = 60 seconds at 1x speed
    // angular velocity = 2π / (periodDays / 365.25 * 60) = 2π * 365.25 / (periodDays * 60)
    const getOrbitalAngularVelocity = (periodDays: number) => {
      return (2 * Math.PI * 365.25) / (periodDays * 60);
    };

    // Moons: orbit around their parent planet's world position
    if (isMoon && moonOrbitRadius > 0) {
      const parentPosArr = useCosmosStore.getState().objectWorldPositions[object.parentId!];
      if (parentPosArr) {
        const periodDays = object.orbitPeriodDays || 27.32; // Default to Moon's period
        const orbitalVelocity = getOrbitalAngularVelocity(periodDays);
        const angle = time * orbitalVelocity;
        groupRef.current.position.x = parentPosArr[0] + Math.cos(angle) * moonOrbitRadius;
        groupRef.current.position.y = parentPosArr[1];
        groupRef.current.position.z = parentPosArr[2] + Math.sin(angle) * moonOrbitRadius;
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

    // Keep a live world-position for camera targeting (planets/moons move)
    const shouldUpdateNow =
      object.id === selectedObjectId ||
      (selectedParentId && object.id === selectedParentId) ||
      time - lastWorldPosUpdate.current > 0.03;

    if (shouldUpdateNow) {
      lastWorldPosUpdate.current = time;
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
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredObject(null);
    document.body.style.cursor = 'default';
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
                roughness: { value: visuals.roughness },
                metalness: { value: visuals.metalness },
                emissive: { value: new THREE.Color(visuals.emissive || '#000000') },
                emissiveIntensity: { value: visuals.emissiveIntensity || 0 },
                time: { value: 0 },
                surfaceType: { value: visuals.surfaceDetail === 'gaseous' ? 1.0 : visuals.surfaceDetail === 'icy' ? 2.0 : visuals.surfaceDetail === 'volcanic' ? 3.0 : 0.0 },
                objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                parentCenter: { value: new THREE.Vector3(0, 0, 0) },
                parentRadius: { value: parentPlanetSize },
                isMoon: { value: isMoon ? 1.0 : 0.0 },
                hasRings: { value: visuals.hasRings ? 1.0 : 0.0 },
                ringInnerRadius: { value: planetSize * 1.3 },
                ringOuterRadius: { value: planetSize * 2.2 },
                planetTilt: { value: tiltRadians },
              }}
              vertexShader={`
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                
                void main() {
                  vUv = uv;
                  vPosition = position;
                  vNormal = normal;
                  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                  vec4 worldPos = modelMatrix * vec4(position, 1.0);
                  vWorldPosition = worldPos.xyz;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 baseColor;
                uniform vec3 secondaryColor;
                uniform float roughness;
                uniform float metalness;
                uniform vec3 emissive;
                uniform float emissiveIntensity;
                uniform float time;
                uniform float surfaceType;
                uniform vec3 objectCenter;
                uniform vec3 parentCenter;
                uniform float parentRadius;
                uniform float isMoon;
                uniform float hasRings;
                uniform float ringInnerRadius;
                uniform float ringOuterRadius;
                uniform float planetTilt;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                
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
                  if (hasRings < 0.5) return 1.0;
                  
                  // Get fragment position relative to planet center
                  vec3 relPos = fragWorldPos - objectCenter;
                  
                  // Build rotation matrix for planet tilt (rings are tilted with planet)
                  float cosT = cos(planetTilt);
                  float sinT = sin(planetTilt);
                  
                  // Transform to ring's local frame (undo tilt)
                  vec3 ringFramePos;
                  ringFramePos.x = relPos.x;
                  ringFramePos.y = relPos.y * cosT + relPos.z * sinT;
                  ringFramePos.z = -relPos.y * sinT + relPos.z * cosT;
                  
                  // Transform sun direction to ring frame
                  vec3 ringFrameSunDir;
                  ringFrameSunDir.x = sunDir.x;
                  ringFrameSunDir.y = sunDir.y * cosT + sunDir.z * sinT;
                  ringFrameSunDir.z = -sunDir.y * sinT + sunDir.z * cosT;
                  
                  if (abs(ringFrameSunDir.y) < 0.0001) return 1.0;
                  
                  float t = -ringFramePos.y / ringFrameSunDir.y;
                  if (t <= 0.0) return 1.0;
                  
                  vec3 hitPoint = ringFramePos + ringFrameSunDir * t;
                  float distFromCenter = length(vec2(hitPoint.x, hitPoint.z));
                  
                  // Check if within ring bounds with penumbra zones
                  float ringWidth = ringOuterRadius - ringInnerRadius;
                  
                  // Calculate penumbra softness based on:
                  // 1. Distance from planet to sun (further = softer shadows)
                  // 2. Ring thickness creates natural blur
                  float sunDist = length(objectCenter);
                  float penumbraScale = 0.03 + (sunDist / 50000.0) * 0.02; // Softer shadows for distant planets
                  float penumbraWidth = ringWidth * penumbraScale;
                  
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
                    float baseDensity = 0.3 + 0.4 * (1.0 - ringPos * 0.5);
                    float ringDensity = baseDensity * mainBands * fineBands * microBands;
                    
                    // Cassini Division - soft gap
                    float cassiniCenter = 0.6;
                    float cassiniWidth = 0.08;
                    float cassiniGap = 1.0 - 0.85 * exp(-pow((ringPos - cassiniCenter) / cassiniWidth, 2.0));
                    ringDensity *= cassiniGap;
                    
                    // Encke Gap (thinner gap in A ring)
                    float enckeGap = 1.0 - 0.5 * exp(-pow((ringPos - 0.82) / 0.02, 2.0));
                    ringDensity *= enckeGap;
                    
                    // Apply penumbra softening - shadows get softer based on density variation
                    float shadowStrength = ringDensity * inRing * 0.7;
                    
                    // Add subtle blur to shadow edges based on sun distance
                    float blur = 1.0 + (sunDist / 30000.0) * 0.3;
                    shadowStrength = pow(shadowStrength, 1.0 / blur);
                    
                    return 1.0 - clamp(shadowStrength, 0.0, 0.75);
                  }
                  return 1.0;
                }
                
                void main() {
                  vec3 worldNormal = normalize(vWorldNormal);
                  // Sun is at origin - use object center for consistent sun direction across the planet
                  vec3 sunDir = normalize(-objectCenter);
                  
                  // For lighting, use per-fragment direction for accurate shading
                  vec3 fragSunDir = normalize(-vWorldPosition);
                  float NdotL = dot(worldNormal, fragSunDir);
                  
                  // Calculate shadows - use planet-center sun direction for ring shadow
                  float moonShadow = calculateShadow(vWorldPosition, fragSunDir);
                  float ringShadow = calculateRingShadow(vWorldPosition, sunDir);
                  float totalShadow = min(moonShadow, ringShadow);
                  
                  float ambient = 0.012;
                  float diffuse = max(NdotL, 0.0) * 0.988 * totalShadow;
                  
                  vec2 noiseCoord = vUv * 20.0;
                  float surfaceNoise = fbm(noiseCoord);
                  
                  vec3 surfaceColor;
                  if (surfaceType > 2.5) {
                    float lava = smoothstep(0.5, 0.7, surfaceNoise);
                    surfaceColor = mix(baseColor, secondaryColor, surfaceNoise * 0.6 + lava * 0.4);
                  } else if (surfaceType > 1.5) {
                    float cracks = smoothstep(0.4, 0.5, surfaceNoise);
                    surfaceColor = mix(baseColor, secondaryColor, cracks * 0.4);
                  } else if (surfaceType > 0.5) {
                    float bands = sin(vUv.y * 30.0 + surfaceNoise * 3.0) * 0.5 + 0.5;
                    surfaceColor = mix(baseColor, secondaryColor, bands * 0.5);
                  } else {
                    surfaceColor = mix(baseColor, secondaryColor, surfaceNoise * 0.5);
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

          {/* Cloud layer for planets with clouds */}
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
                  
                  varying vec3 vWorldNormal;
                  varying vec3 vWorldPosition;
                  varying vec2 vUv;
                  
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
                    for (int i = 0; i < 4; i++) {
                      value += amplitude * noise(p);
                      p *= 2.0;
                      amplitude *= 0.5;
                    }
                    return value;
                  }
                  
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
                    
                    vec2 cloudCoord = vUv * 15.0 + time * 0.01;
                    float clouds = fbm(cloudCoord);
                    float cloudCoverage = smoothstep(0.35, 0.65, clouds);
                    
                    float lighting = 0.02 + NdotL * 0.98 * shadow;
                    vec3 litCloud = cloudColor * lighting;
                    
                    gl_FragColor = vec4(litCloud, cloudCoverage * 0.5 * NdotL * shadow);
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
                    float rim = pow(1.0 - abs(dot(worldNormal, viewDir)), 2.5);
                    
                    float sunGlow = smoothstep(-0.1, 0.3, NdotL) * shadow;
                    
                    gl_FragColor = vec4(glowColor, rim * intensity * sunGlow);
                  }
                `}
              />
            </mesh>
          )}

          {/* Rings (Saturn, Uranus) - enhanced with lighting and planet shadow */}
          {visuals.hasRings && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planetSize * 1.3, planetSize * 2.2, 128]} />
              <shaderMaterial
                ref={ringMaterialRef}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                uniforms={{
                  ringColor: { value: new THREE.Color(visuals.ringColor || '#d4b896') },
                  opacity: { value: visuals.ringOpacity || 0.7 },
                  innerRadius: { value: planetSize * 1.3 },
                  outerRadius: { value: planetSize * 2.2 },
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
                    
                    // Main ring divisions (A, B, C rings)
                    float ringA = smoothstep(0.7, 0.72, normalizedDist) * smoothstep(1.0, 0.98, normalizedDist);
                    float ringB = smoothstep(0.35, 0.38, normalizedDist) * smoothstep(0.68, 0.65, normalizedDist);
                    float ringC = smoothstep(0.0, 0.03, normalizedDist) * smoothstep(0.33, 0.30, normalizedDist);
                    
                    // Density varies by ring
                    float ringADensity = 0.85;
                    float ringBDensity = 1.0;  // B ring is densest
                    float ringCDensity = 0.4;  // C ring is faint
                    
                    // Fine radial structure - thousands of ringlets
                    float fineStructure = 0.7 + 0.3 * sin(normalizedDist * 400.0 + fbm(normalizedDist * 50.0) * 2.0);
                    float microStructure = 0.85 + 0.15 * sin(normalizedDist * 1500.0);
                    float ultraFine = 0.92 + 0.08 * noise(normalizedDist * 3000.0);
                    
                    // Azimuthal variation (spokes and clumps)
                    float azimuthalVar = 0.95 + 0.05 * sin(angle * 30.0 + normalizedDist * 10.0);
                    float spokes = 0.97 + 0.03 * sin(angle * 8.0) * sin(normalizedDist * 20.0);
                    
                    // Combine ring sections with their densities
                    float baseDensity = ringA * ringADensity + ringB * ringBDensity + ringC * ringCDensity;
                    
                    // Apply fine structure
                    float ringDensity = baseDensity * fineStructure * microStructure * ultraFine * azimuthalVar * spokes;
                    
                    // === GAPS ===
                    
                    // Cassini Division (between A and B rings)
                    float cassiniGap = 1.0 - 0.95 * exp(-pow((normalizedDist - 0.685) / 0.025, 2.0));
                    
                    // Encke Gap (in A ring)
                    float enckeGap = 1.0 - 0.8 * exp(-pow((normalizedDist - 0.88) / 0.008, 2.0));
                    
                    // Keeler Gap (outer A ring)
                    float keelerGap = 1.0 - 0.7 * exp(-pow((normalizedDist - 0.96) / 0.004, 2.0));
                    
                    // Colombo Gap (in C ring)
                    float colomboGap = 1.0 - 0.6 * exp(-pow((normalizedDist - 0.15) / 0.01, 2.0));
                    
                    // Maxwell Gap (in C ring)
                    float maxwellGap = 1.0 - 0.5 * exp(-pow((normalizedDist - 0.22) / 0.008, 2.0));
                    
                    ringDensity *= cassiniGap * enckeGap * keelerGap * colomboGap * maxwellGap;
                    
                    // === COLOR VARIATION ===
                    
                    // Rings have subtle color variation (redder inner, bluer outer)
                    vec3 innerColor = ringColor * vec3(1.05, 0.98, 0.92);
                    vec3 outerColor = ringColor * vec3(0.95, 0.98, 1.05);
                    vec3 finalColor = mix(innerColor, outerColor, normalizedDist);
                    
                    // B ring has slightly different hue (more golden)
                    vec3 bRingTint = vec3(1.02, 1.0, 0.95);
                    finalColor = mix(finalColor, finalColor * bRingTint, ringB * 0.3);
                    
                    // C ring is darker/grayer
                    vec3 cRingTint = vec3(0.85, 0.85, 0.88);
                    finalColor = mix(finalColor, finalColor * cRingTint, ringC * 0.5);
                    
                    // Add subtle particle glitter on lit side
                    float glitter = noise2D(vec2(normalizedDist * 500.0, angle * 50.0));
                    glitter = pow(glitter, 8.0) * 0.3 * max(NdotL, 0.0);
                    finalColor += vec3(glitter);
                    
                    // === OPACITY ===
                    
                    float ringOpacity = opacity * ringDensity;
                    float edgeFade = smoothstep(0.0, 0.05, normalizedDist) * smoothstep(1.0, 0.95, normalizedDist);
                    float alpha = clamp(ringOpacity * edgeFade, 0.0, 0.95);
                    
                    // Lit ring with enhanced brightness
                    float ringBrightness = 1.8;
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
