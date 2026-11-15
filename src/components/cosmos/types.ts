// Cosmos type definitions

export type ScaleLevel = 'earth' | 'solarSystem' | 'stellar' | 'milkyWay' | 'localGroup' | 'virgoSupercluster' | 'laniakea' | 'universe';

export interface CelestialObject {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  type: 'planet' | 'star' | 'moon' | 'dwarf-planet' | 'asteroid' | 'comet' | 'nebula' | 'galaxy' | 'cluster' | 'supercluster' | 'void' | 'other';
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
  orbitSpeed?: number;        // deprecated - use orbitPeriodDays
  orbitPeriodDays?: number;   // real orbital period in Earth days
  rotationSpeed?: number;
  parentId?: string; // For moons - the id of the parent planet
  category: 'solarSystem' | 'stars' | 'nebulae' | 'galaxies' | 'deepSpace';
  // Which cosmic structure this object belongs to
  cosmicStructure?: 'localGroup' | 'virgoCluster' | 'virgoSupercluster';
}

/** Tour text: English and French always; other content languages optional (fall back through the dictionary). */
export type TourText = { en: string; fr: string; es?: string; pt?: string; it?: string; de?: string };

export interface TourStop {
  id: string;
  locationId: string;
  title: TourText;
  narration: TourText;
  duration: number; // seconds
  cameraPosition: [number, number, number];
  lookAt?: [number, number, number]; // Optional - if not set, camera looks at the object
  scaleLevel: ScaleLevel;
  /** UTC ISO date (or "now") the app clock jumps to for this stop. */
  date?: string;
  /** Optional end of a date range played while the stop shows. */
  playUntil?: string;
  /** Simulated seconds per real second while playing (may be finer than the date control's speeds). */
  rate?: number;
  /** "hw:<id>": follow that NASA machine instead of flying to locationId. */
  follow?: string;
  distanceKm?: number;
  photoIds?: string[];
  /** Narrative camera framing; not measured spacecraft attitude. */
  viewBodyId?: string;
  viewMode?: 'encounter' | 'look-back';
  factIds?: string[];
}

export interface Tour {
  id: string;
  title: TourText;
  stops: TourStop[];
  /** "end-frame": dispatch cosmos:journey-end (Begin at Earth only). */
  onEnd: 'end-frame' | 'left-behind-summary';
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
// Accurate cosmic hierarchy:
// - Local Group: ~10 Mly diameter
// - Virgo Supercluster: ~110 Mly diameter  
// - Laniakea Supercluster: ~520 Mly diameter
// - Observable Universe: ~93 Bly diameter
export const SCALE_BOUNDARIES = {
  earth: { min: 0, max: 1000 },
  solarSystem: { min: 1000, max: 14959787070 }, // 100 AU in km
  stellar: { min: 14959787070, max: 9.461e14 }, // 100 ly in km
  milkyWay: { min: 9.461e14, max: 9.461e17 }, // 100,000 ly in km
  localGroup: { min: 9.461e17, max: 9.461e19 }, // 10 million ly in km
  virgoSupercluster: { min: 9.461e19, max: 1.04e21 }, // 110 million ly in km
  laniakea: { min: 1.04e21, max: 4.92e21 }, // 520 million ly in km
  universe: { min: 4.92e21, max: 4.4e23 }, // 46.5 billion ly in km
} as const;

// Unit conversions
export const UNITS = {
  KM_PER_AU: 149597870.7,
  KM_PER_LY: 9.461e12,
  KM_PER_MLY: 9.461e18,
  KM_PER_BLY: 9.461e21,
} as const;
