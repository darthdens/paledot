import { TourStop, UNITS } from '../types';

// Tour stops now use relative camera offsets from the target object
// The CameraController will compute actual positions based on live world positions
// Object radii in km for consistent zoom calculations
const OBJECT_RADII: Record<string, number> = {
  earth: 6371,
  moon: 1737,
  sun: 696350,
  jupiter: 69911,
  saturn: 58232,
  uranus: 25362,
};

// Consistent zoom multiplier: camera distance = radius * ZOOM_MULTIPLIER
const ZOOM_MULTIPLIER = 4;

export const tourStops: TourStop[] = [
  {
    id: 'intro',
    locationId: 'earth',
    title: {
      en: 'Welcome to the Cosmos',
      fr: 'Bienvenue dans le Cosmos',
    },
    narration: {
      en: 'Welcome to the Cosmos Explorer. We begin our journey on Earth, our home planet in the vast universe. Let\'s embark on an incredible voyage from here to the edge of the observable universe.',
      fr: 'Bienvenue dans l\'Explorateur du Cosmos. Nous commençons notre voyage sur Terre, notre planète dans l\'immense univers. Embarquons pour un voyage incroyable d\'ici jusqu\'aux confins de l\'univers observable.',
    },
    duration: 8,
    // Consistent zoom: ~4x Earth radius
    cameraPosition: [0, OBJECT_RADII.earth * 0.5, OBJECT_RADII.earth * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'earth',
  },
  {
    id: 'leaving-earth',
    locationId: 'moon',
    title: {
      en: 'Leaving Earth',
      fr: 'Quitter la Terre',
    },
    narration: {
      en: 'Rising above Earth\'s atmosphere, we see our Moon - the only celestial body humans have visited. It\'s 384,400 km away, a distance light crosses in just 1.3 seconds.',
      fr: 'En s\'élevant au-dessus de l\'atmosphère terrestre, nous voyons notre Lune - le seul corps céleste que les humains ont visité. Elle est à 384 400 km, une distance que la lumière traverse en seulement 1,3 seconde.',
    },
    duration: 7,
    // Consistent zoom: ~4x Moon radius
    cameraPosition: [0, OBJECT_RADII.moon * 0.5, OBJECT_RADII.moon * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'earth',
  },
  {
    id: 'inner-planets',
    locationId: 'sun',
    title: {
      en: 'The Solar System',
      fr: 'Le Système Solaire',
    },
    narration: {
      en: 'At the center of our solar system sits the Sun, containing 99.86% of all the mass. The inner rocky planets - Mercury, Venus, Earth, and Mars - orbit closest to its warmth.',
      fr: 'Au centre de notre système solaire se trouve le Soleil, contenant 99,86% de toute la masse. Les planètes rocheuses intérieures - Mercure, Vénus, Terre et Mars - orbitent au plus près de sa chaleur.',
    },
    duration: 8,
    cameraPosition: [0, 2 * UNITS.KM_PER_AU, 0],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'gas-giants',
    locationId: 'jupiter',
    title: {
      en: 'Jupiter - King of Planets',
      fr: 'Jupiter - Roi des Planètes',
    },
    narration: {
      en: 'Beyond the asteroid belt, we find Jupiter, the largest planet. It could fit all other planets inside it. Its Great Red Spot is a storm larger than Earth that has raged for centuries.',
      fr: 'Au-delà de la ceinture d\'astéroïdes, nous trouvons Jupiter, la plus grande planète. Elle pourrait contenir toutes les autres. Sa Grande Tache Rouge est une tempête plus grande que la Terre qui fait rage depuis des siècles.',
    },
    duration: 8,
    // Consistent zoom: ~4x Jupiter radius
    cameraPosition: [0, OBJECT_RADII.jupiter * 0.5, OBJECT_RADII.jupiter * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'saturn-rings',
    locationId: 'saturn',
    title: {
      en: 'Saturn\'s Magnificent Rings',
      fr: 'Les Anneaux Magnifiques de Saturne',
    },
    narration: {
      en: 'Saturn\'s iconic rings are made of billions of ice and rock particles. Despite spanning 282,000 km, they\'re incredibly thin - averaging just 10 meters thick.',
      fr: 'Les anneaux emblématiques de Saturne sont composés de milliards de particules de glace et de roche. Malgré leurs 282 000 km d\'envergure, ils sont incroyablement fins - en moyenne seulement 10 mètres d\'épaisseur.',
    },
    duration: 7,
    // Consistent zoom: ~4x Saturn radius
    cameraPosition: [0, OBJECT_RADII.saturn * 0.5, OBJECT_RADII.saturn * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'ice-giant',
    locationId: 'uranus',
    title: {
      en: 'Uranus - The Tilted Planet',
      fr: 'Uranus - La Planète Inclinée',
    },
    narration: {
      en: 'Uranus is unique among planets - it rotates on its side, likely due to a massive ancient collision. This ice giant has 27 known moons and faint rings.',
      fr: 'Uranus est unique parmi les planètes - elle tourne sur le côté, probablement en raison d\'une collision massive ancienne. Cette géante de glace possède 27 lunes connues et de faibles anneaux.',
    },
    duration: 7,
    // Consistent zoom: ~4x Uranus radius
    cameraPosition: [0, OBJECT_RADII.uranus * 0.5, OBJECT_RADII.uranus * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'milky-way',
    locationId: 'milky-way-center',
    title: {
      en: 'The Milky Way Galaxy',
      fr: 'La Voie Lactée',
    },
    narration: {
      en: 'Rising above the galactic plane, our Milky Way reveals its spiral structure. Our Sun is located on the Orion Arm, about 26,000 light-years from the supermassive black hole at the center.',
      fr: 'En s\'élevant au-dessus du plan galactique, notre Voie Lactée révèle sa structure spirale. Notre Soleil est situé sur le Bras d\'Orion, à environ 26 000 années-lumière du trou noir supermassif au centre.',
    },
    duration: 10,
    cameraPosition: [0, 50000 * UNITS.KM_PER_LY, 0],
    lookAt: [26000 * UNITS.KM_PER_LY, 0, 0],
    scaleLevel: 'milkyWay',
  },
  {
    id: 'orion-nebula',
    locationId: 'orion-nebula',
    title: {
      en: 'The Orion Nebula',
      fr: 'La Nébuleuse d\'Orion',
    },
    narration: {
      en: 'The Orion Nebula is one of the brightest nebulae visible to the naked eye. Located 1,344 light-years away, it\'s a stellar nursery where new stars are being born.',
      fr: 'La Nébuleuse d\'Orion est l\'une des nébuleuses les plus brillantes visibles à l\'œil nu. Située à 1 344 années-lumière, c\'est une pouponnière stellaire où de nouvelles étoiles naissent.',
    },
    duration: 8,
    // Much closer to see the nebula details (offset from the nebula center)
    cameraPosition: [0, 40 * UNITS.KM_PER_LY, 120 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'stellar',
  },
  {
    id: 'conclusion',
    locationId: 'earth',
    title: {
      en: 'Home Again',
      fr: 'De Retour à la Maison',
    },
    narration: {
      en: 'Our journey through the cosmos comes to an end, returning to our pale blue dot. In the vastness of space, Earth remains our only home - a precious oasis of life in the cosmic desert.',
      fr: 'Notre voyage à travers le cosmos touche à sa fin, de retour sur notre point bleu pâle. Dans l\'immensité de l\'espace, la Terre reste notre seule maison - une précieuse oasis de vie dans le désert cosmique.',
    },
    duration: 10,
    // Same view as intro - consistent zoom: ~4x Earth radius
    cameraPosition: [0, OBJECT_RADII.earth * 0.5, OBJECT_RADII.earth * ZOOM_MULTIPLIER],
    lookAt: [0, 0, 0],
    scaleLevel: 'earth',
  },
];
