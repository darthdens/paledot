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
  const lastWorldPosUpdate = useRef(0);
  const rotationAngle = useRef(0);
  
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const setHoveredObject = useCosmosStore(state => state.setHoveredObject);
  const setObjectWorldPosition = useCosmosStore(state => state.setObjectWorldPosition);
  const selectedObject = useCosmosStore(state => state.selectedObject);
  const timeSpeed = useCosmosStore(state => state.timeSpeed);
  const selectedObjectId = selectedObject?.id;
  const selectedParentId = selectedObject?.type === 'moon' ? selectedObject.parentId : null;

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
  const isMoon = !!object.parentId;

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
    const time = state.clock.getElapsedTime() * timeSpeed;

    // Planet rotation with accurate real rotation speeds (delta in seconds)
    rotationAngle.current += rotationSpeed * delta * timeSpeed;
    if (planetRef.current) {
      planetRef.current.rotation.y = rotationAngle.current;
    }

    // Update shader uniforms for proper lighting - pass the object's center world position
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current);

      if (planetMaterialRef.current) {
        planetMaterialRef.current.uniforms.time.value = time;
        planetMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      }
      if (cloudMaterialRef.current) {
        cloudMaterialRef.current.uniforms.time.value = time;
        cloudMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      }
      if (atmosphereMaterialRef.current) {
        atmosphereMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      }
      if (ringMaterialRef.current) {
        ringMaterialRef.current.uniforms.objectCenter.value.copy(worldPos.current);
      }
    }

    if (groupRef.current) {
      // Calculate orbital angular velocity from real orbital period
      // Scale: 1 Earth year (365.25 days) = 60 seconds at 1x speed
      // angular velocity = 2π / (periodDays / 365.25 * 60) = 2π * 365.25 / (periodDays * 60)
      const getOrbitalAngularVelocity = (periodDays: number) => {
        return (2 * Math.PI * 365.25) / (periodDays * 60);
      };

      // Moons: orbit around their parent planet's world position
      if (isMoon && moonOrbitRadius > 0) {
        const parentPos = useCosmosStore.getState().objectWorldPositions[object.parentId!];
        if (parentPos) {
          const periodDays = object.orbitPeriodDays || 27.32; // Default to Moon's period
          const orbitalVelocity = getOrbitalAngularVelocity(periodDays);
          const angle = time * orbitalVelocity;
          groupRef.current.position.x = parentPos[0] + Math.cos(angle) * moonOrbitRadius;
          groupRef.current.position.y = parentPos[1];
          groupRef.current.position.z = parentPos[2] + Math.sin(angle) * moonOrbitRadius;
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

      // Keep a live world-position for camera targeting (planets/moons move)
      // Update the selected object every frame for smoother camera tracking.
      // Also update the parent planet every frame when a moon is selected, so moon motion stays smooth.
      const shouldUpdateNow =
        object.id === selectedObjectId ||
        (selectedParentId && object.id === selectedParentId) ||
        time - lastWorldPosUpdate.current > 0.03;
      if (shouldUpdateNow) {
        lastWorldPosUpdate.current = time;
        groupRef.current.getWorldPosition(worldPos.current);
        setObjectWorldPosition(object.id, [worldPos.current.x, worldPos.current.y, worldPos.current.z]);
      }
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
              }}
              vertexShader={`
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                
                void main() {
                  vUv = uv;
                  vPosition = position;
                  vNormal = normal;
                  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
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
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldNormal;
                
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
                
                void main() {
                  vec3 worldNormal = normalize(vWorldNormal);
                  // Sun is at origin - light direction from object center toward sun
                  vec3 lightDir = normalize(-objectCenter);
                  
                  // Calculate sun-facing illumination (realistic lighting)
                  float NdotL = max(dot(worldNormal, lightDir), 0.0);
                  
                  // Add subtle ambient to see dark side slightly
                  float ambient = 0.08;
                  float diffuse = NdotL * 0.92;
                  
                  // Generate surface variation based on type
                  vec2 noiseCoord = vUv * 20.0;
                  float surfaceNoise = fbm(noiseCoord);
                  
                  // Different noise patterns for different surface types
                  vec3 surfaceColor;
                  if (surfaceType > 2.5) {
                    // Volcanic - hot spots
                    float lava = smoothstep(0.5, 0.7, surfaceNoise);
                    surfaceColor = mix(baseColor, secondaryColor, surfaceNoise * 0.6 + lava * 0.4);
                  } else if (surfaceType > 1.5) {
                    // Icy - crack patterns
                    float cracks = smoothstep(0.4, 0.5, surfaceNoise);
                    surfaceColor = mix(baseColor, secondaryColor, cracks * 0.4);
                  } else if (surfaceType > 0.5) {
                    // Gaseous - banded patterns
                    float bands = sin(vUv.y * 30.0 + surfaceNoise * 3.0) * 0.5 + 0.5;
                    surfaceColor = mix(baseColor, secondaryColor, bands * 0.5);
                  } else {
                    // Rocky - craters and terrain
                    surfaceColor = mix(baseColor, secondaryColor, surfaceNoise * 0.5);
                  }
                  
                  // Apply lighting
                  vec3 litColor = surfaceColor * (ambient + diffuse);
                  
                  // Add rim lighting for atmosphere effect
                  float rimLight = pow(1.0 - max(dot(worldNormal, lightDir), 0.0), 3.0);
                  litColor += rimLight * 0.1 * surfaceColor;
                  
                  // Add emissive (for Sun)
                  litColor += emissive * emissiveIntensity;
                  
                  // Simple specular highlight
                  vec3 halfDir = normalize(lightDir + lightDir);
                  float spec = pow(max(dot(worldNormal, halfDir), 0.0), 32.0 / max(roughness, 0.1));
                  litColor += spec * (1.0 - roughness) * 0.2 * NdotL;
                  
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
                }}
                vertexShader={`
                  varying vec3 vWorldNormal;
                  varying vec2 vUv;
                  
                  void main() {
                    vUv = uv;
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  uniform vec3 cloudColor;
                  uniform float time;
                  uniform vec3 objectCenter;
                  
                  varying vec3 vWorldNormal;
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
                  
                  void main() {
                    vec3 worldNormal = normalize(vWorldNormal);
                    // Sun at origin
                    vec3 lightDir = normalize(-objectCenter);
                    float NdotL = max(dot(worldNormal, lightDir), 0.0);
                    
                    vec2 cloudCoord = vUv * 15.0 + time * 0.01;
                    float clouds = fbm(cloudCoord);
                    float cloudCoverage = smoothstep(0.35, 0.65, clouds);
                    
                    float lighting = 0.1 + NdotL * 0.9;
                    vec3 litCloud = cloudColor * lighting;
                    
                    // Clouds only visible on lit side
                    gl_FragColor = vec4(litCloud, cloudCoverage * 0.5 * (0.2 + NdotL * 0.8));
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
                }}
                vertexShader={`
                  varying vec3 vWorldNormal;
                  void main() {
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  varying vec3 vWorldNormal;
                  uniform vec3 glowColor;
                  uniform float intensity;
                  uniform vec3 objectCenter;
                  
                  void main() {
                    vec3 worldNormal = normalize(vWorldNormal);
                    // Sun at origin
                    vec3 lightDir = normalize(-objectCenter);
                    float NdotL = max(dot(worldNormal, lightDir), 0.0);
                    
                    // Fresnel-like rim glow
                    float rim = pow(0.7 - dot(worldNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    
                    // Brighter on sun-facing side
                    float sunGlow = 0.15 + NdotL * 0.85;
                    
                    gl_FragColor = vec4(glowColor, rim * intensity * sunGlow);
                  }
                `}
              />
            </mesh>
          )}

          {/* Rings (Saturn, Uranus) - enhanced with lighting */}
          {visuals.hasRings && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planetSize * 1.3, planetSize * 2.2, 128]} />
              <shaderMaterial
                ref={ringMaterialRef}
                transparent
                side={THREE.DoubleSide}
                uniforms={{
                  ringColor: { value: new THREE.Color(visuals.ringColor || '#d4b896') },
                  opacity: { value: visuals.ringOpacity || 0.7 },
                  innerRadius: { value: planetSize * 1.3 },
                  outerRadius: { value: planetSize * 2.2 },
                  objectCenter: { value: new THREE.Vector3(0, 0, 0) },
                }}
                vertexShader={`
                  varying vec2 vUv;
                  varying vec3 vWorldPosition;
                  varying vec3 vWorldNormal;
                  
                  void main() {
                    vUv = uv;
                    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                  }
                `}
                fragmentShader={`
                  uniform vec3 ringColor;
                  uniform float opacity;
                  uniform float innerRadius;
                  uniform float outerRadius;
                  uniform vec3 objectCenter;
                  
                  varying vec2 vUv;
                  varying vec3 vWorldPosition;
                  varying vec3 vWorldNormal;
                  
                  float hash(float n) { return fract(sin(n) * 43758.5453); }
                  
                  void main() {
                    // Sun at origin - use object center for consistent lighting
                    vec3 lightDir = normalize(-objectCenter);
                    float NdotL = abs(dot(normalize(vWorldNormal), lightDir));
                    
                    // Create ring bands
                    float dist = length(vWorldPosition.xz);
                    float normalizedDist = (dist - innerRadius) / (outerRadius - innerRadius);
                    float bands = sin(normalizedDist * 60.0) * 0.5 + 0.5;
                    bands = mix(0.6, 1.0, bands);
                    
                    // Add gaps in rings
                    float gap = smoothstep(0.45, 0.5, normalizedDist) * (1.0 - smoothstep(0.5, 0.55, normalizedDist));
                    float ringOpacity = opacity * bands * (1.0 - gap * 0.8);
                    
                    // Lighting - darker on shadow side
                    float lighting = 0.2 + NdotL * 0.8;
                    vec3 litRing = ringColor * lighting;
                    
                    // Fade edges
                    float edgeFade = smoothstep(0.0, 0.1, normalizedDist) * smoothstep(1.0, 0.9, normalizedDist);
                    
                    gl_FragColor = vec4(litRing, ringOpacity * edgeFade);
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
