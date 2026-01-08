import { TourStop, UNITS } from '../types';

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
    cameraPosition: [0, 0, 50000],
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
    cameraPosition: [500000, 100000, 200000],
    lookAt: [384400, 0, 0],
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
      en: 'The Gas Giants',
      fr: 'Les Géantes Gazeuses',
    },
    narration: {
      en: 'Beyond the asteroid belt, we find the gas giants. Jupiter, the largest planet, could fit all other planets inside it. Saturn\'s rings span 282,000 km but are only 10 meters thick!',
      fr: 'Au-delà de la ceinture d\'astéroïdes, nous trouvons les géantes gazeuses. Jupiter, la plus grande planète, pourrait contenir toutes les autres. Les anneaux de Saturne s\'étendent sur 282 000 km mais n\'ont que 10 mètres d\'épaisseur!',
    },
    duration: 8,
    cameraPosition: [5.2 * UNITS.KM_PER_AU, 0.5 * UNITS.KM_PER_AU, 2 * UNITS.KM_PER_AU],
    lookAt: [5.2 * UNITS.KM_PER_AU, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'interstellar',
    locationId: 'proxima-centauri',
    title: {
      en: 'Into Interstellar Space',
      fr: 'Vers l\'Espace Interstellaire',
    },
    narration: {
      en: 'Leaving our solar system, we enter interstellar space. Voyager 1, launched in 1977, is now 24 billion km from Earth - yet Proxima Centauri, our nearest star, is still 4.24 light-years away.',
      fr: 'Quittant notre système solaire, nous entrons dans l\'espace interstellaire. Voyager 1, lancée en 1977, est maintenant à 24 milliards de km de la Terre - pourtant Proxima Centauri, notre étoile la plus proche, est encore à 4,24 années-lumière.',
    },
    duration: 8,
    cameraPosition: [2 * UNITS.KM_PER_LY, 0.5 * UNITS.KM_PER_LY, 2 * UNITS.KM_PER_LY],
    lookAt: [4.24 * UNITS.KM_PER_LY, 0.5 * UNITS.KM_PER_LY, 0],
    scaleLevel: 'stellar',
  },
  {
    id: 'stellar-neighborhood',
    locationId: 'sirius',
    title: {
      en: 'Our Stellar Neighborhood',
      fr: 'Notre Voisinage Stellaire',
    },
    narration: {
      en: 'Within 10 light-years, we find about a dozen star systems. Sirius, the brightest star in our night sky, shines 25 times more luminously than our Sun from 8.6 light-years away.',
      fr: 'Dans un rayon de 10 années-lumière, nous trouvons une douzaine de systèmes stellaires. Sirius, l\'étoile la plus brillante de notre ciel nocturne, brille 25 fois plus que notre Soleil depuis 8,6 années-lumière.',
    },
    duration: 7,
    cameraPosition: [5 * UNITS.KM_PER_LY, 0, 5 * UNITS.KM_PER_LY],
    lookAt: [8.6 * UNITS.KM_PER_LY, 0, 2 * UNITS.KM_PER_LY],
    scaleLevel: 'stellar',
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
    duration: 8,
    cameraPosition: [0, 50000 * UNITS.KM_PER_LY, 0],
    lookAt: [26000 * UNITS.KM_PER_LY, 0, 0],
    scaleLevel: 'milkyWay',
  },
  {
    id: 'local-group',
    locationId: 'andromeda',
    title: {
      en: 'The Local Group',
      fr: 'Le Groupe Local',
    },
    narration: {
      en: 'The Milky Way is just one of over 80 galaxies in our Local Group. Andromeda, our nearest major neighbor, is approaching us at 110 km/s. In 4.5 billion years, our galaxies will merge.',
      fr: 'La Voie Lactée n\'est qu\'une des plus de 80 galaxies de notre Groupe Local. Andromède, notre plus proche voisine majeure, s\'approche de nous à 110 km/s. Dans 4,5 milliards d\'années, nos galaxies fusionneront.',
    },
    duration: 8,
    cameraPosition: [1.5e6 * UNITS.KM_PER_LY, 0.5e6 * UNITS.KM_PER_LY, 1e6 * UNITS.KM_PER_LY],
    lookAt: [2.537e6 * UNITS.KM_PER_LY, 0, 0],
    scaleLevel: 'localGroup',
  },
  {
    id: 'cosmic-web',
    locationId: 'virgo-cluster',
    title: {
      en: 'The Cosmic Web',
      fr: 'La Toile Cosmique',
    },
    narration: {
      en: 'Zooming out further, galaxies form a cosmic web of filaments and voids. The Virgo Cluster contains 2,000 galaxies and is the gravitational center of our Laniakea Supercluster.',
      fr: 'En zoomant encore, les galaxies forment une toile cosmique de filaments et de vides. L\'Amas de la Vierge contient 2 000 galaxies et est le centre gravitationnel de notre Superamas Laniakea.',
    },
    duration: 8,
    cameraPosition: [30e6 * UNITS.KM_PER_LY, 20e6 * UNITS.KM_PER_LY, 30e6 * UNITS.KM_PER_LY],
    lookAt: [54e6 * UNITS.KM_PER_LY, 0, 20e6 * UNITS.KM_PER_LY],
    scaleLevel: 'universe',
  },
  {
    id: 'edge-of-universe',
    locationId: 'observable-universe-edge',
    title: {
      en: 'The Edge of Everything',
      fr: 'La Limite de Tout',
    },
    narration: {
      en: 'We\'ve reached the edge of the observable universe - 46.5 billion light-years away. Beyond this boundary lies the Cosmic Microwave Background, light from 380,000 years after the Big Bang. What lies beyond? The universe continues, but its light hasn\'t reached us yet.',
      fr: 'Nous avons atteint la limite de l\'univers observable - à 46,5 milliards d\'années-lumière. Au-delà de cette frontière se trouve le Fond Diffus Cosmologique, lumière de 380 000 ans après le Big Bang. Qu\'y a-t-il au-delà? L\'univers continue, mais sa lumière ne nous a pas encore atteints.',
    },
    duration: 10,
    cameraPosition: [20e9 * UNITS.KM_PER_LY, 10e9 * UNITS.KM_PER_LY, 20e9 * UNITS.KM_PER_LY],
    lookAt: [46.5e9 * UNITS.KM_PER_LY, 0, 0],
    scaleLevel: 'universe',
  },
];
