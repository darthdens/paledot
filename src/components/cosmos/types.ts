// Cosmos type definitions

export type ScaleLevel = 'earth' | 'solarSystem' | 'stellar' | 'milkyWay' | 'localGroup' | 'universe';

export interface CelestialObject {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  type: 'planet' | 'star' | 'moon' | 'dwarf-planet' | 'asteroid' | 'nebula' | 'galaxy' | 'cluster' | 'other';
  position: [number, number, number];
  size: number;
  color: string;
  distanceFromEarth: number; // in km
  distanceUnit: 'km' | 'AU' | 'ly' | 'Mly' | 'Bly';
  facts?: {
    en: string[];
    fr: string[];
  };
  texture?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  rotationSpeed?: number;
  category: 'solarSystem' | 'stars' | 'nebulae' | 'galaxies' | 'deepSpace';
}

export interface TourStop {
  id: string;
  locationId: string;
  title: {
    en: string;
    fr: string;
  };
  narration: {
    en: string;
    fr: string;
  };
  duration: number; // seconds
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
  scaleLevel: ScaleLevel;
}

export interface QuickJumpCategory {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  locations: string[]; // CelestialObject ids
}

export interface CosmosState {
  currentScale: ScaleLevel;
  cameraDistance: number;
  selectedObject: CelestialObject | null;
  isTouring: boolean;
  tourProgress: number;
  tourSpeed: number;
  isPaused: boolean;
  showControlHints: boolean;
  recentJumps: string[];
}

// Scale boundaries in km
export const SCALE_BOUNDARIES = {
  earth: { min: 0, max: 1000 },
  solarSystem: { min: 1000, max: 14959787070 }, // 100 AU in km
  stellar: { min: 14959787070, max: 9.461e14 }, // 100 ly in km
  milkyWay: { min: 9.461e14, max: 9.461e17 }, // 100,000 ly in km
  localGroup: { min: 9.461e17, max: 9.461e19 }, // 10 million ly in km
  universe: { min: 9.461e19, max: 4.4e23 }, // 46.5 billion ly in km
} as const;

// Unit conversions
export const UNITS = {
  KM_PER_AU: 149597870.7,
  KM_PER_LY: 9.461e12,
  KM_PER_MLY: 9.461e18,
  KM_PER_BLY: 9.461e21,
} as const;
