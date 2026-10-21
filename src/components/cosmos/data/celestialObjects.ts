import { CelestialObject, UNITS } from '../types';

// Real orbital periods in Earth days for accurate Keplerian orbital speeds
export const ORBITAL_PERIODS: Record<string, number> = {
  mercury: 87.97,
  venus: 224.7,
  earth: 365.25,
  moon: 27.32,        // Around Earth
  mars: 686.98,
  ceres: 1680,        // In asteroid belt
  jupiter: 4332.59,
  io: 1.77,           // Around Jupiter
  europa: 3.55,       // Around Jupiter
  ganymede: 7.15,     // Around Jupiter
  callisto: 16.69,    // Around Jupiter
  saturn: 10759.22,
  enceladus: 1.37,    // Around Saturn
  titan: 15.95,       // Around Saturn
  iapetus: 79.32,     // Around Saturn
  uranus: 30688.5,
  neptune: 60182,
  triton: 5.88,       // Around Neptune (retrograde)
  pluto: 90560,
};

export const celestialObjects: CelestialObject[] = [
  // ==================== SOLAR SYSTEM ====================
  // The Sun (center of solar system)
  {
    id: 'sun',
    name: { en: 'Sun', fr: 'Soleil' },
    type: 'star',
    position: [0, 0, 0],
    size: 1392700,
    color: '#FDB813',
    distanceFromEarth: UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    rotationSpeed: 0.0005,
    facts: {
      en: ['G-type main-sequence star', 'Contains 99.86% of solar system mass', 'Surface temperature: 5,500°C'],
      fr: ['Étoile naine jaune de type G', 'Contient 99,86% de la masse du système solaire', 'Température de surface: 5 500°C'],
    },
  },
  // Mercury
  {
    id: 'mercury',
    name: { en: 'Mercury', fr: 'Mercure' },
    type: 'planet',
    position: [0.39 * UNITS.KM_PER_AU, 0, 0],
    size: 4879,
    color: '#8c8c8c',
    distanceFromEarth: 0.61 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 0.39 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["mercury"],
    facts: {
      en: ['Smallest planet in solar system', 'Orbital period: 88 days', 'No atmosphere'],
      fr: ['Plus petite planète du système solaire', 'Période orbitale: 88 jours', 'Pas d\'atmosphère'],
    },
  },
  // Venus
  {
    id: 'venus',
    name: { en: 'Venus', fr: 'Vénus' },
    type: 'planet',
    position: [0.72 * UNITS.KM_PER_AU, 0, 0],
    size: 12104,
    color: '#e6c35c',
    distanceFromEarth: 0.28 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 0.72 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["venus"],
    facts: {
      en: ['Hottest planet (462°C)', 'Rotates backwards', 'Day longer than year'],
      fr: ['Planète la plus chaude (462°C)', 'Rotation rétrograde', 'Jour plus long que l\'année'],
    },
  },
  // Earth
  {
    id: 'earth',
    name: { en: 'Earth', fr: 'Terre' },
    type: 'planet',
    position: [UNITS.KM_PER_AU, 0, 0],
    size: 12742,
    color: '#6b93d6',
    distanceFromEarth: 0,
    distanceUnit: 'km',
    category: 'solarSystem',
    orbitRadius: UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["earth"],
    facts: {
      en: ['Only known planet with life', 'Age: 4.5 billion years', '71% covered by water'],
      fr: ['Seule planète connue avec la vie', 'Âge: 4,5 milliards d\'années', '71% couverte d\'eau'],
    },
  },
  // Earth's Moon
  {
    id: 'moon',
    name: { en: 'Moon', fr: 'Lune' },
    type: 'moon',
    position: [UNITS.KM_PER_AU + 384400, 0, 0],
    size: 3474,
    color: '#c4c4c4',
    distanceFromEarth: 384400,
    distanceUnit: 'km',
    category: 'solarSystem',
    orbitRadius: 384400,
    orbitPeriodDays: ORBITAL_PERIODS["moon"],
    parentId: 'earth',
    facts: {
      en: ['Earth\'s only natural satellite', 'Formed 4.5 billion years ago', 'Causes tides on Earth'],
      fr: ['Seul satellite naturel de la Terre', 'Formée il y a 4,5 milliards d\'années', 'Cause les marées sur Terre'],
    },
  },
  // Mars
  {
    id: 'mars',
    name: { en: 'Mars', fr: 'Mars' },
    type: 'planet',
    position: [1.52 * UNITS.KM_PER_AU, 0, 0],
    size: 6779,
    color: '#c1440e',
    distanceFromEarth: 0.52 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 1.52 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["mars"],
    facts: {
      en: ['The Red Planet', 'Has the largest volcano (Olympus Mons)', 'Fourth planet from the Sun'],
      fr: ['La planète rouge', 'Possède le plus grand volcan (Olympus Mons)', 'Quatrième planète du Soleil'],
    },
  },
  // Ceres (Dwarf planet in asteroid belt)
  {
    id: 'ceres',
    name: { en: 'Ceres', fr: 'Cérès' },
    type: 'dwarf-planet',
    position: [2.77 * UNITS.KM_PER_AU, 0, 0],
    size: 939,
    color: '#a0a0a0',
    distanceFromEarth: 1.77 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 2.77 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["ceres"],
    facts: {
      en: ['Largest object in asteroid belt', 'Only dwarf planet in inner solar system', 'Contains 1/3 of asteroid belt mass'],
      fr: ['Plus gros objet de la ceinture', 'Seule planète naine interne', 'Contient 1/3 de la masse de la ceinture'],
    },
  },
  // Jupiter
  {
    id: 'jupiter',
    name: { en: 'Jupiter', fr: 'Jupiter' },
    type: 'planet',
    position: [5.2 * UNITS.KM_PER_AU, 0, 0],
    size: 139820,
    color: '#d8ca9d',
    distanceFromEarth: 4.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 5.2 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["jupiter"],
    facts: {
      en: ['Largest planet in solar system', 'Great Red Spot storm', '95 known moons'],
      fr: ['Plus grande planète du système solaire', 'Grande Tache Rouge', '95 lunes connues'],
    },
  },
  // Jupiter's Galilean Moons
  {
    id: 'io',
    name: { en: 'Io', fr: 'Io' },
    type: 'moon',
    position: [5.2 * UNITS.KM_PER_AU + 421800, 0, 0],
    size: 3643,
    color: '#f5d742',
    distanceFromEarth: 4.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 421800,
    orbitPeriodDays: ORBITAL_PERIODS["io"],
    parentId: 'jupiter',
    facts: {
      en: ['Most volcanically active body', 'Over 400 active volcanoes', 'Sulfur-covered surface'],
      fr: ['Corps le plus actif volcaniquement', 'Plus de 400 volcans actifs', 'Surface couverte de soufre'],
    },
  },
  {
    id: 'europa',
    name: { en: 'Europa', fr: 'Europe' },
    type: 'moon',
    position: [5.2 * UNITS.KM_PER_AU + 671100, 0, 0],
    size: 3122,
    color: '#c9b896',
    distanceFromEarth: 4.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 671100,
    orbitPeriodDays: ORBITAL_PERIODS["europa"],
    parentId: 'jupiter',
    facts: {
      en: ['Has subsurface ocean', 'Possible conditions for life', 'Smoothest surface in solar system'],
      fr: ['Possède un océan souterrain', 'Conditions possibles pour la vie', 'Surface la plus lisse'],
    },
  },
  {
    id: 'ganymede',
    name: { en: 'Ganymede', fr: 'Ganymède' },
    type: 'moon',
    position: [5.2 * UNITS.KM_PER_AU + 1070400, 0, 0],
    size: 5268,
    color: '#9e9e9e',
    distanceFromEarth: 4.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 1070400,
    orbitPeriodDays: ORBITAL_PERIODS["ganymede"],
    parentId: 'jupiter',
    facts: {
      en: ['Largest moon in solar system', 'Larger than Mercury', 'Has its own magnetic field'],
      fr: ['Plus grande lune du système', 'Plus grande que Mercure', 'Champ magnétique propre'],
    },
  },
  {
    id: 'callisto',
    name: { en: 'Callisto', fr: 'Callisto' },
    type: 'moon',
    position: [5.2 * UNITS.KM_PER_AU + 1882700, 0, 0],
    size: 4821,
    color: '#6b6b6b',
    distanceFromEarth: 4.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 1882700,
    orbitPeriodDays: ORBITAL_PERIODS["callisto"],
    parentId: 'jupiter',
    facts: {
      en: ['Most heavily cratered object', 'May have subsurface ocean', 'Ancient, geologically dead'],
      fr: ['Objet le plus cratérisé', 'Océan souterrain possible', 'Ancienne, géologiquement morte'],
    },
  },
  // Saturn
  {
    id: 'saturn',
    name: { en: 'Saturn', fr: 'Saturne' },
    type: 'planet',
    position: [9.5 * UNITS.KM_PER_AU, 0, 0],
    size: 116460,
    color: '#ead6b8',
    distanceFromEarth: 8.5 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 9.5 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["saturn"],
    facts: {
      en: ['Famous for its rings', 'Could float on water', '146 known moons'],
      fr: ['Célèbre pour ses anneaux', 'Pourrait flotter sur l\'eau', '146 lunes connues'],
    },
  },
  // Enceladus (Saturn moon)
  {
    id: 'enceladus',
    name: { en: 'Enceladus', fr: 'Encelade' },
    type: 'moon',
    position: [9.5 * UNITS.KM_PER_AU + 238042, 0, 0],
    size: 504,
    color: '#ffffff',
    distanceFromEarth: 8.5 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 238042,
    orbitPeriodDays: ORBITAL_PERIODS["enceladus"],
    parentId: 'saturn',
    facts: {
      en: ['Brightest object in solar system', 'Has water geysers', 'Possible conditions for life'],
      fr: ['Objet le plus brillant', 'Geysers d\'eau', 'Conditions possibles pour la vie'],
    },
  },
  // Titan (Saturn moon)
  {
    id: 'titan',
    name: { en: 'Titan', fr: 'Titan' },
    type: 'moon',
    position: [9.5 * UNITS.KM_PER_AU + 1221870, 0, 0],
    size: 5150,
    color: '#e8a43c',
    distanceFromEarth: 8.5 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 1221870,
    orbitPeriodDays: ORBITAL_PERIODS["titan"],
    parentId: 'saturn',
    facts: {
      en: ['Only moon with dense atmosphere', 'Lakes of liquid methane', 'Larger than Mercury'],
      fr: ['Seule lune avec atmosphère dense', 'Lacs de méthane liquide', 'Plus grande que Mercure'],
    },
  },
  // Iapetus (Saturn moon)
  {
    id: 'iapetus',
    name: { en: 'Iapetus', fr: 'Japet' },
    type: 'moon',
    position: [9.5 * UNITS.KM_PER_AU + 3560854, 0, 0],
    size: 1469,
    color: '#5a4a3a',
    distanceFromEarth: 8.5 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 3560854,
    orbitPeriodDays: ORBITAL_PERIODS["iapetus"],
    parentId: 'saturn',
    facts: {
      en: ['Two-toned coloring (light/dark)', 'Has an equatorial ridge', 'Third largest moon of Saturn'],
      fr: ['Coloration bicolore (clair/sombre)', 'Crête équatoriale', '3ème plus grande lune de Saturne'],
    },
  },
  // Uranus
  {
    id: 'uranus',
    name: { en: 'Uranus', fr: 'Uranus' },
    type: 'planet',
    position: [19.2 * UNITS.KM_PER_AU, 0, 0],
    size: 50724,
    color: '#d1e7e7',
    distanceFromEarth: 18.2 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 19.2 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["uranus"],
    facts: {
      en: ['Rotates on its side', 'Ice giant', 'Coldest atmosphere (-224°C)'],
      fr: ['Tourne sur le côté', 'Géante de glace', 'Atmosphère la plus froide (-224°C)'],
    },
  },
  // Neptune
  {
    id: 'neptune',
    name: { en: 'Neptune', fr: 'Neptune' },
    type: 'planet',
    position: [30.1 * UNITS.KM_PER_AU, 0, 0],
    size: 49244,
    color: '#5b5ddf',
    distanceFromEarth: 29.1 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 30.1 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["neptune"],
    facts: {
      en: ['Strongest winds in solar system', 'Discovered mathematically', '14 known moons'],
      fr: ['Vents les plus forts du système', 'Découverte mathématiquement', '14 lunes connues'],
    },
  },
  // Triton (Neptune moon)
  {
    id: 'triton',
    name: { en: 'Triton', fr: 'Triton' },
    type: 'moon',
    position: [30.1 * UNITS.KM_PER_AU + 354759, 0, 0],
    size: 2707,
    color: '#d4c4b4',
    distanceFromEarth: 29.1 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 354759,
    orbitPeriodDays: ORBITAL_PERIODS["triton"],
    parentId: 'neptune',
    facts: {
      en: ['Only large moon with retrograde orbit', 'Coldest known object (-235°C)', 'Has nitrogen geysers'],
      fr: ['Seule grande lune rétrograde', 'Objet le plus froid (-235°C)', 'Geysers d\'azote'],
    },
  },
  // Pluto (dwarf planet)
  {
    id: 'pluto',
    name: { en: 'Pluto', fr: 'Pluton' },
    type: 'dwarf-planet',
    position: [39.5 * UNITS.KM_PER_AU, 0, 0],
    size: 2376,
    color: '#b5a48a',
    distanceFromEarth: 38.5 * UNITS.KM_PER_AU,
    distanceUnit: 'AU',
    category: 'solarSystem',
    orbitRadius: 39.5 * UNITS.KM_PER_AU,
    orbitPeriodDays: ORBITAL_PERIODS["pluto"],
    facts: {
      en: ['Reclassified as dwarf planet in 2006', 'Has a heart-shaped glacier', '5 known moons'],
      fr: ['Reclassée planète naine en 2006', 'Glacier en forme de cœur', '5 lunes connues'],
    },
  },

  // ==================== STARS ====================
  {
    id: 'alpha-centauri',
    name: { en: 'Alpha Centauri', fr: 'Alpha du Centaure' },
    type: 'star',
    position: [4.37 * UNITS.KM_PER_LY, 0, 0],
    size: 1700000,
    color: '#fff4e8',
    distanceFromEarth: 4.37,
    distanceUnit: 'ly',
    category: 'stars',
    facts: {
      en: ['Closest star system to the Sun', 'Triple star system', 'Alpha Centauri A is similar to our Sun'],
      fr: ['Système stellaire le plus proche', 'Système d\'étoiles triple', 'Alpha Centauri A similaire au Soleil'],
    },
  },
  {
    id: 'proxima-centauri',
    name: { en: 'Proxima Centauri', fr: 'Proxima du Centaure' },
    type: 'star',
    // Galactic coordinates: l=313.54°, b=-1.93°, d=4.24 ly from Sun (which is at scene origin)
    // Position in light-years (will be scaled by visualScale * KM_PER_LY in renderer)
    // Original: x ≈ 2.90 ly, y ≈ -0.14 ly, z ≈ -3.08 ly - doubled for better visibility
    position: [5.80, -0.28, -6.16], // in light-years, 2x actual distance for visual separation
    size: 214550, // diameter in km
    color: '#ffcccb',
    distanceFromEarth: 4.24,
    distanceUnit: 'ly',
    category: 'stars',
    facts: {
      en: ['Closest star to the Sun', 'Red dwarf star', 'Has at least 2 exoplanets'],
      fr: ['Étoile la plus proche du Soleil', 'Naine rouge', 'Au moins 2 exoplanètes'],
    },
  },
  {
    id: 'sirius',
    name: { en: 'Sirius', fr: 'Sirius' },
    type: 'star',
    position: [8.6 * UNITS.KM_PER_LY, 0, 2 * UNITS.KM_PER_LY],
    size: 2380000,
    color: '#a0c4ff',
    distanceFromEarth: 8.6,
    distanceUnit: 'ly',
    category: 'stars',
    facts: {
      en: ['Brightest star in night sky', 'Binary star system', 'Also known as the Dog Star'],
      fr: ['Étoile la plus brillante', 'Système binaire', 'Aussi appelée l\'étoile du Chien'],
    },
  },
  {
    id: 'betelgeuse',
    name: { en: 'Betelgeuse', fr: 'Bételgeuse' },
    type: 'star',
    position: [700 * UNITS.KM_PER_LY, 100 * UNITS.KM_PER_LY, 0],
    size: 1234000000,
    color: '#ff6b35',
    distanceFromEarth: 700,
    distanceUnit: 'ly',
    category: 'stars',
    facts: {
      en: ['Red supergiant star', 'Could explode as supernova anytime', 'One of the largest known stars'],
      fr: ['Supergéante rouge', 'Pourrait exploser en supernova', 'Une des plus grandes étoiles'],
    },
  },
  {
    id: 'polaris',
    name: { en: 'Polaris', fr: 'Étoile Polaire' },
    type: 'star',
    position: [0, 433 * UNITS.KM_PER_LY, 0],
    size: 53000000,
    color: '#ffffd4',
    distanceFromEarth: 433,
    distanceUnit: 'ly',
    category: 'stars',
    facts: {
      en: ['The North Star', 'Triple star system', 'Used for navigation for centuries'],
      fr: ['L\'Étoile du Nord', 'Système triple', 'Navigation depuis des siècles'],
    },
  },

  // ==================== NEBULAE ====================
  {
    id: 'orion-nebula',
    name: { en: 'Orion Nebula', fr: 'Nébuleuse d\'Orion' },
    type: 'nebula',
    // Galactic coordinates: l=209°, b=-19°, d=1344 ly from Sun (which is at scene origin)
    // Position in light-years (will be scaled by visualScale * KM_PER_LY in renderer)
    // x = d*cos(b)*cos(l) ≈ -1112 ly, y = d*sin(b) ≈ -438 ly, z = d*cos(b)*sin(l) ≈ -617 ly
    position: [-1112, -438, -617], // in light-years, not km
    size: 24, // 24 light-years across
    color: '#ff69b4',
    distanceFromEarth: 1344,
    distanceUnit: 'ly',
    category: 'nebulae',
    facts: {
      en: ['Closest massive star-forming region', 'Visible to the naked eye', '24 light-years across'],
      fr: ['Région de formation d\'étoiles la plus proche', 'Visible à l\'œil nu', '24 années-lumière'],
    },
  },
  {
    id: 'crab-nebula',
    name: { en: 'Crab Nebula', fr: 'Nébuleuse du Crabe' },
    type: 'nebula',
    position: [6500 * UNITS.KM_PER_LY, 200 * UNITS.KM_PER_LY, 0],
    size: 11 * UNITS.KM_PER_LY,
    color: '#00bfff',
    distanceFromEarth: 6500,
    distanceUnit: 'ly',
    category: 'nebulae',
    facts: {
      en: ['Supernova remnant from 1054 AD', 'Contains a pulsar at center', 'Expanding at 1,500 km/s'],
      fr: ['Rémanent de supernova de 1054', 'Contient un pulsar', 'S\'étend à 1 500 km/s'],
    },
  },
  {
    id: 'eagle-nebula',
    name: { en: 'Eagle Nebula', fr: 'Nébuleuse de l\'Aigle' },
    type: 'nebula',
    position: [7000 * UNITS.KM_PER_LY, -500 * UNITS.KM_PER_LY, 1000 * UNITS.KM_PER_LY],
    size: 70 * UNITS.KM_PER_LY,
    color: '#9370db',
    distanceFromEarth: 7000,
    distanceUnit: 'ly',
    category: 'nebulae',
    facts: {
      en: ['Home to Pillars of Creation', 'Active star-forming region', 'Discovered in 1745'],
      fr: ['Piliers de la Création', 'Formation d\'étoiles active', 'Découverte en 1745'],
    },
  },
  {
    id: 'ring-nebula',
    name: { en: 'Ring Nebula', fr: 'Nébuleuse de l\'Anneau' },
    type: 'nebula',
    position: [2300 * UNITS.KM_PER_LY, 100 * UNITS.KM_PER_LY, -500 * UNITS.KM_PER_LY],
    size: 1.3 * UNITS.KM_PER_LY,
    color: '#7fff00',
    distanceFromEarth: 2300,
    distanceUnit: 'ly',
    category: 'nebulae',
    facts: {
      en: ['Planetary nebula', 'Formed by a dying star', 'About 4,000 years old'],
      fr: ['Nébuleuse planétaire', 'Étoile mourante', 'Environ 4 000 ans'],
    },
  },

  // ==================== GALAXIES ====================
  {
    id: 'milky-way-center',
    name: { en: 'Milky Way', fr: 'Voie Lactée' },
    type: 'galaxy',
    position: [26000 * UNITS.KM_PER_LY, 0, 0],
    size: 100000 * UNITS.KM_PER_LY,
    color: '#fff8dc',
    distanceFromEarth: 26000,
    distanceUnit: 'ly',
    category: 'galaxies',
    facts: {
      en: ['Supermassive black hole Sagittarius A*', '200-400 billion stars', 'Our home galaxy'],
      fr: ['Trou noir Sagittarius A*', '200-400 milliards d\'étoiles', 'Notre galaxie'],
    },
  },
  {
    id: 'andromeda',
    name: { en: 'Andromeda', fr: 'Andromède' },
    type: 'galaxy',
    position: [2.537e6 * UNITS.KM_PER_LY * 0.7, 2.537e6 * UNITS.KM_PER_LY * 0.15, 2.537e6 * UNITS.KM_PER_LY * 0.7],
    size: 152000 * UNITS.KM_PER_LY, // Accurate diameter
    color: '#a0c4ff', // Blue-white color
    distanceFromEarth: 2.537,
    distanceUnit: 'Mly',
    category: 'galaxies',
    facts: {
      en: ['Nearest major galaxy at 2.5M light-years', 'Will collide with Milky Way in 4.5B years', '~1 trillion stars, 77° inclination'],
      fr: ['Galaxie majeure la plus proche à 2,5M années-lumière', 'Collision avec la Voie Lactée dans 4,5 milliards d\'années', '~1 billion d\'étoiles, inclinaison de 77°'],
    },
  },
  {
    id: 'triangulum',
    name: { en: 'Triangulum', fr: 'Triangle' },
    type: 'galaxy',
    // Position matches TriangulumGalaxy.tsx component
    position: [-2.73e6 * UNITS.KM_PER_LY * 0.5, 2.73e6 * UNITS.KM_PER_LY * 0.1, 2.73e6 * UNITS.KM_PER_LY * 0.85],
    size: 60000 * UNITS.KM_PER_LY,
    color: '#7ecfff', // Blue with pink tints
    distanceFromEarth: 2.73,
    distanceUnit: 'Mly',
    category: 'galaxies',
    facts: {
      en: ['Third-largest in Local Group at 2.73M ly', '~60,000 light-years diameter (half of Milky Way)', '~40 billion stars with prominent HII regions'],
      fr: ['3ème plus grande du Groupe Local à 2,73M al', '~60 000 années-lumière de diamètre', '~40 milliards d\'étoiles avec régions HII'],
    },
  },
  {
    id: 'whirlpool',
    name: { en: 'Whirlpool', fr: 'Tourbillon' },
    type: 'galaxy',
    position: [23e6 * UNITS.KM_PER_LY, 5e6 * UNITS.KM_PER_LY, 10e6 * UNITS.KM_PER_LY],
    size: 76000 * UNITS.KM_PER_LY,
    color: '#dda0dd',
    distanceFromEarth: 23,
    distanceUnit: 'Mly',
    category: 'galaxies',
    facts: {
      en: ['Grand-design spiral at 23M ly with 2 iconic arms', 'First galaxy with spiral structure identified (1845)', 'Interacting with companion NGC 5195'],
      fr: ['Spirale majestueuse à 23M al avec 2 bras iconiques', 'Première galaxie spirale identifiée (1845)', 'Interagit avec NGC 5195'],
    },
  },
  {
    id: 'sombrero',
    name: { en: 'Sombrero', fr: 'Sombrero' },
    type: 'galaxy',
    position: [29.3e6 * UNITS.KM_PER_LY, -10e6 * UNITS.KM_PER_LY, 15e6 * UNITS.KM_PER_LY],
    size: 50000 * UNITS.KM_PER_LY,
    color: '#f5deb3',
    distanceFromEarth: 29.3,
    distanceUnit: 'Mly',
    category: 'galaxies',
    facts: {
      en: ['Named for hat-like appearance', 'Large central bulge', '100 billion stars'],
      fr: ['Apparence de chapeau', 'Grand bulbe central', '100 milliards d\'étoiles'],
    },
  },

  // ==================== DEEP SPACE ====================
  // These are VIEWPOINTS - the position is where the CAMERA goes, looking at origin (center of universe)
  // Positions are in light-years, will be scaled by UNITS.KM_PER_LY * UNIFIED_SCALE
  
  // LOCAL GROUP (~10 Mly) - view centered to see Milky Way, Andromeda, Triangulum together
  {
    id: 'local-group',
    name: { en: 'Local Group', fr: 'Groupe Local' },
    type: 'cluster',
    // Camera viewpoint position - offset from origin to see the Local Group galaxies
    position: [4e6, 2e6, 4e6], // 4 Mly away, looking back at origin
    size: 10e6, // ~10 Mly diameter in light-years (used for info display)
    color: '#87ceeb',
    distanceFromEarth: 0, // We're in it
    distanceUnit: 'Mly',
    category: 'deepSpace',
    facts: {
      en: ['Our galaxy neighborhood', 'Contains 80+ galaxies', 'Milky Way & Andromeda dominate'],
      fr: ['Notre voisinage galactique', 'Contient 80+ galaxies', 'Voie Lactée et Andromède dominent'],
    },
  },
  
  // VIRGO SUPERCLUSTER (~110 Mly) - contains Local Group and many clusters
  {
    id: 'virgo-supercluster',
    name: { en: 'Virgo Supercluster', fr: 'Superamas de la Vierge' },
    type: 'supercluster',
    // Camera viewpoint position - farther out to see supercluster structure
    position: [80e6, 40e6, 60e6], // 80 Mly away
    size: 110e6, // ~110 Mly diameter
    color: '#ffb347',
    distanceFromEarth: 0, // We're in it
    distanceUnit: 'Mly',
    category: 'deepSpace',
    facts: {
      en: ['Contains ~100 galaxy groups/clusters', '~110 million light-years across', 'Part of Laniakea'],
      fr: ['Contient ~100 groupes/amas', '~110 millions d\'années-lumière', 'Fait partie de Laniakea'],
    },
  },
  
  // LANIAKEA SUPERCLUSTER (~520 Mly) - our home supercluster view (shows cosmic web structure)
  {
    id: 'laniakea',
    name: { en: 'Laniakea Supercluster', fr: 'Superamas Laniakea' },
    type: 'supercluster',
    // Camera viewpoint position - far enough to see cosmic web filaments
    position: [400e6, 200e6, 300e6], // 400 Mly away
    size: 520e6, // ~520 Mly diameter
    color: '#9370db',
    distanceFromEarth: 0, // We're in it
    distanceUnit: 'Mly',
    category: 'deepSpace',
    facts: {
      en: ['Our home supercluster ("immense heaven")', '~100,000 galaxies, 520 Mly across', 'Discovered in 2014'],
      fr: ['Notre superamas ("ciel immense")', '~100 000 galaxies, 520 Mal', 'Découvert en 2014'],
    },
  },
  
  // OBSERVABLE UNIVERSE (~93 Bly diameter) - maximum zoom out to see cosmic web
  {
    id: 'observable-universe',
    name: { en: 'Observable Universe', fr: 'Univers Observable' },
    type: 'other',
    // Camera viewpoint position - very far out to see the entire cosmic web structure
    position: [80e9, 50e9, 60e9], // 80 Bly away - maximum zoom out
    size: 93e9, // 93 Bly diameter
    color: '#dc143c',
    distanceFromEarth: 46.5,
    distanceUnit: 'Bly',
    category: 'deepSpace',
    facts: {
      en: ['Radius: 46.5 billion light-years', 'Contains ~2 trillion galaxies', 'Cosmic microwave background edge'],
      fr: ['Rayon: 46,5 milliards d\'années-lumière', 'Contient ~2 billions de galaxies', 'Limite du fond diffus cosmologique'],
    },
  },
];

export const quickJumpCategories = [
  {
    id: 'solarSystem',
    name: { en: 'Solar System', fr: 'Système Solaire' },
    locations: [
      'sun', 'mercury', 'venus', 'earth', 'moon', 
      'mars', 'phobos', 'deimos', 
      'ceres',
      'jupiter', 'io', 'europa', 'ganymede', 'callisto', 
      'saturn', 'mimas', 'enceladus', 'tethys', 'dione', 'rhea', 'titan', 'iapetus',
      'uranus', 'miranda', 'ariel', 'umbriel', 'titania', 'oberon',
      'neptune', 'triton',
      'pluto'
    ],
  },
  {
    id: 'stars',
    name: { en: 'Stars', fr: 'Étoiles' },
    locations: ['sun', 'alpha-centauri', 'proxima-centauri', 'sirius', 'betelgeuse', 'polaris'],
  },
  {
    id: 'nebulae',
    name: { en: 'Nebulae', fr: 'Nébuleuses' },
    locations: ['orion-nebula', 'crab-nebula', 'eagle-nebula', 'ring-nebula'],
  },
  {
    id: 'galaxies',
    name: { en: 'Galaxies', fr: 'Galaxies' },
    locations: ['milky-way-center', 'andromeda', 'triangulum', 'whirlpool', 'sombrero'],
  },
  {
    id: 'deepSpace',
    name: { en: 'Deep Space', fr: 'Espace Profond' },
    locations: [
      'local-group',
      'virgo-supercluster',
      'laniakea',
      'observable-universe'
    ],
  },
];

export const getObjectById = (id: string): CelestialObject | undefined => {
  return celestialObjects.find(obj => obj.id === id);
};
