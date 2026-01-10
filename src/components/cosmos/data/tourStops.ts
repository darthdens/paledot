import { TourStop, UNITS } from '../types';

// Tour stops use hardcoded camera offsets for consistent viewing distances
// Camera positions are [x, y, z] offsets from the target object in km

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
    // Earth radius is 6371 km - increased distance for mobile visibility
    cameraPosition: [0, 25000, 75000],
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
    // Moon radius is 1737 km - increased for mobile
    cameraPosition: [0, 8000, 24000],
    lookAt: [0, 0, 0],
    scaleLevel: 'earth',
  },
  {
    id: 'venus',
    locationId: 'venus',
    title: {
      en: 'Venus - Earth\'s Twin',
      fr: 'Vénus - La Jumelle de la Terre',
    },
    narration: {
      en: 'Venus, our closest planetary neighbor, is often called Earth\'s twin due to its similar size. But beneath its thick clouds lies a hellish world - with surface temperatures of 465°C and crushing atmospheric pressure 90 times that of Earth.',
      fr: 'Vénus, notre plus proche voisine planétaire, est souvent appelée la jumelle de la Terre en raison de sa taille similaire. Mais sous ses épais nuages se cache un monde infernal - avec des températures de surface de 465°C et une pression atmosphérique écrasante 90 fois supérieure à celle de la Terre.',
    },
    duration: 7,
    // Venus radius is 6052 km - increased distance for mobile
    cameraPosition: [0, 24000, 72000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'mercury',
    locationId: 'mercury',
    title: {
      en: 'Mercury - The Swift Planet',
      fr: 'Mercure - La Planète Rapide',
    },
    narration: {
      en: 'Mercury, the smallest planet, races around the Sun in just 88 days. Its surface is scarred by countless craters and experiences extreme temperature swings - from 430°C in sunlight to -180°C in shadow.',
      fr: 'Mercure, la plus petite planète, fait le tour du Soleil en seulement 88 jours. Sa surface est marquée par d\'innombrables cratères et connaît des variations de température extrêmes - de 430°C au soleil à -180°C dans l\'ombre.',
    },
    duration: 7,
    // Mercury radius is 2440 km - increased for mobile
    cameraPosition: [0, 12000, 36000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'red-planet',
    locationId: 'mars',
    title: {
      en: 'Mars - The Red Planet',
      fr: 'Mars - La Planète Rouge',
    },
    narration: {
      en: 'Mars, the Red Planet, has captivated humanity for centuries. Its rusty color comes from iron oxide on its surface. Home to Olympus Mons, the largest volcano in the solar system, Mars remains our best candidate for future human colonization.',
      fr: 'Mars, la Planète Rouge, fascine l\'humanité depuis des siècles. Sa couleur rouille provient de l\'oxyde de fer à sa surface. Abritant Olympus Mons, le plus grand volcan du système solaire, Mars reste notre meilleur candidat pour une future colonisation humaine.',
    },
    duration: 8,
    // Mars radius is 3390 km - increased for mobile
    cameraPosition: [0, 16000, 48000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'asteroid-belt',
    locationId: 'ceres',
    title: {
      en: 'The Asteroid Belt',
      fr: 'La Ceinture d\'Astéroïdes',
    },
    narration: {
      en: 'Between Mars and Jupiter lies the asteroid belt, home to millions of rocky remnants from the solar system\'s formation. Ceres, the largest object here, is a dwarf planet containing about a third of the belt\'s total mass.',
      fr: 'Entre Mars et Jupiter se trouve la ceinture d\'astéroïdes, abritant des millions de vestiges rocheux de la formation du système solaire. Cérès, le plus gros objet ici, est une planète naine contenant environ un tiers de la masse totale de la ceinture.',
    },
    duration: 7,
    // Ceres radius is 473 km - increased significantly for mobile visibility
    cameraPosition: [0, 4000, 12000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
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
    // Jupiter radius is 69911 km - much larger, scale accordingly
    cameraPosition: [0, 175000, 525000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'europa',
    locationId: 'europa',
    title: {
      en: 'Europa - Ocean Moon',
      fr: 'Europe - La Lune Océan',
    },
    narration: {
      en: 'Beneath Europa\'s icy crust lies a global ocean containing more water than all of Earth\'s oceans combined. This makes it one of the most promising places to search for extraterrestrial life in our solar system.',
      fr: 'Sous la croûte glacée d\'Europe se trouve un océan global contenant plus d\'eau que tous les océans de la Terre réunis. Cela en fait l\'un des endroits les plus prometteurs pour rechercher la vie extraterrestre dans notre système solaire.',
    },
    duration: 7,
    // Europa radius is 1561 km - increased for mobile visibility
    cameraPosition: [0, 7000, 21000],
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
    // Saturn radius is 58232 km - large gas giant
    cameraPosition: [0, 145000, 440000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'titan',
    locationId: 'titan',
    title: {
      en: 'Titan - A Moon with an Atmosphere',
      fr: 'Titan - Une Lune avec une Atmosphère',
    },
    narration: {
      en: 'Titan is the only moon in our solar system with a dense atmosphere - even thicker than Earth\'s. Beneath its orange haze lie lakes and seas of liquid methane, making it one of the most Earth-like worlds we\'ve discovered.',
      fr: 'Titan est la seule lune de notre système solaire avec une atmosphère dense - encore plus épaisse que celle de la Terre. Sous sa brume orange se trouvent des lacs et des mers de méthane liquide, en faisant l\'un des mondes les plus semblables à la Terre que nous ayons découverts.',
    },
    duration: 7,
    // Titan radius is 2575 km - increased for mobile visibility
    cameraPosition: [0, 10000, 30000],
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
    // Uranus radius is 25362 km - ice giant
    cameraPosition: [0, 65000, 190000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'neptune',
    locationId: 'neptune',
    title: {
      en: 'Neptune - The Windiest Planet',
      fr: 'Neptune - La Planète la Plus Venteuse',
    },
    narration: {
      en: 'Neptune, the most distant planet, was discovered through mathematics before it was ever seen. Its deep blue color comes from methane in its atmosphere, and it hosts the fastest winds in the solar system - reaching 2,100 km/h.',
      fr: 'Neptune, la planète la plus éloignée, a été découverte par les mathématiques avant d\'être observée. Sa couleur bleu profond provient du méthane dans son atmosphère, et elle abrite les vents les plus rapides du système solaire - atteignant 2 100 km/h.',
    },
    duration: 7,
    // Neptune radius is 24622 km - similar to Uranus
    cameraPosition: [0, 62000, 185000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'pluto',
    locationId: 'pluto',
    title: {
      en: 'Pluto - The Dwarf Planet',
      fr: 'Pluton - La Planète Naine',
    },
    narration: {
      en: 'At the edge of our solar system lies Pluto, reclassified as a dwarf planet in 2006. Despite its small size, it has five moons and a heart-shaped nitrogen glacier larger than Texas. It marks the gateway to the Kuiper Belt.',
      fr: 'Aux confins de notre système solaire se trouve Pluton, reclassifiée planète naine en 2006. Malgré sa petite taille, elle possède cinq lunes et un glacier d\'azote en forme de cœur plus grand que le Texas. Elle marque la porte d\'entrée de la ceinture de Kuiper.',
    },
    duration: 7,
    // Pluto radius is 1188 km - increased significantly for mobile
    cameraPosition: [0, 6000, 18000],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'kuiper-belt',
    locationId: 'pluto',
    title: {
      en: 'The Kuiper Belt',
      fr: 'La Ceinture de Kuiper',
    },
    narration: {
      en: 'Beyond Neptune stretches the Kuiper Belt, a vast ring of icy bodies and dwarf planets extending billions of kilometers into space. This frozen frontier contains remnants from the solar system\'s birth, including countless comets waiting to be discovered.',
      fr: 'Au-delà de Neptune s\'étend la ceinture de Kuiper, un vaste anneau de corps glacés et de planètes naines s\'étendant sur des milliards de kilomètres dans l\'espace. Cette frontière gelée contient des vestiges de la naissance du système solaire, y compris d\'innombrables comètes attendant d\'être découvertes.',
    },
    duration: 8,
    // Wide view to show the Kuiper Belt region
    cameraPosition: [0, 10 * UNITS.KM_PER_AU, 15 * UNITS.KM_PER_AU],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'oort-cloud',
    locationId: 'sun',
    title: {
      en: 'The Oort Cloud',
      fr: 'Le Nuage d\'Oort',
    },
    narration: {
      en: 'At the outermost edge of our solar system lies the Oort Cloud, a theoretical shell of icy objects extending up to 100,000 AU from the Sun - nearly halfway to the nearest star. This is where long-period comets originate, taking millions of years to complete a single orbit.',
      fr: 'À l\'extrémité de notre système solaire se trouve le nuage d\'Oort, une enveloppe théorique d\'objets glacés s\'étendant jusqu\'à 100 000 UA du Soleil - presque à mi-chemin de l\'étoile la plus proche. C\'est de là que proviennent les comètes à longue période, mettant des millions d\'années pour compléter une seule orbite.',
    },
    duration: 8,
    // Much wider view to show the full Oort Cloud sphere (extends to ~100,000 AU)
    cameraPosition: [0, 2000 * UNITS.KM_PER_AU, 3000 * UNITS.KM_PER_AU],
    lookAt: [0, 0, 0],
    scaleLevel: 'solarSystem',
  },
  {
    id: 'proxima-centauri',
    locationId: 'proxima-centauri',
    title: {
      en: 'Proxima Centauri - Our Nearest Star',
      fr: 'Proxima du Centaure - Notre Étoile la Plus Proche',
    },
    narration: {
      en: 'Just 4.24 light-years away, Proxima Centauri is the closest star to our Sun. This red dwarf hosts at least two planets, including Proxima b, which orbits in the habitable zone where liquid water could exist.',
      fr: 'À seulement 4,24 années-lumière, Proxima du Centaure est l\'étoile la plus proche de notre Soleil. Cette naine rouge abrite au moins deux planètes, dont Proxima b, qui orbite dans la zone habitable où l\'eau liquide pourrait exister.',
    },
    duration: 8,
    // Match Quick Jump: CameraController uses a 500x visual boost for distant stars and flies to ~5x boosted size.
    cameraPosition: [268187500, 160912500, 536375000],
    lookAt: [0, 0, 0],
    scaleLevel: 'stellar',
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
    // Position camera above and behind the galactic center for a centered top-down view
    cameraPosition: [0, 60000 * UNITS.KM_PER_LY, 30000 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'milkyWay',
  },
  {
    id: 'andromeda',
    locationId: 'andromeda',
    title: {
      en: 'Andromeda Galaxy',
      fr: 'La Galaxie d\'Andromède',
    },
    narration: {
      en: 'The Andromeda Galaxy, also known as M31, is the nearest major galaxy to the Milky Way at 2.5 million light-years away. It contains roughly one trillion stars and is on a collision course with our galaxy - but don\'t worry, the merger won\'t happen for another 4.5 billion years.',
      fr: 'La galaxie d\'Andromède, également connue sous le nom de M31, est la grande galaxie la plus proche de la Voie Lactée à 2,5 millions d\'années-lumière. Elle contient environ mille milliards d\'étoiles et est en trajectoire de collision avec notre galaxie - mais ne vous inquiétez pas, la fusion n\'aura lieu que dans 4,5 milliards d\'années.',
    },
    duration: 10,
    // Close-up tilted view to see the spiral structure - Andromeda is ~220,000 ly diameter
    cameraPosition: [120000 * UNITS.KM_PER_LY, 80000 * UNITS.KM_PER_LY, 180000 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'localGroup',
  },
  {
    id: 'triangulum',
    locationId: 'triangulum',
    title: {
      en: 'Triangulum Galaxy (M33)',
      fr: 'La Galaxie du Triangle (M33)',
    },
    narration: {
      en: 'The Triangulum Galaxy is the third-largest member of our Local Group, about 2.73 million light-years away. With around 40 billion stars, it\'s roughly half the size of our Milky Way. Notice its distinctive blue spiral arms dotted with pink star-forming regions.',
      fr: 'La Galaxie du Triangle est le troisième plus grand membre de notre Groupe Local, à environ 2,73 millions d\'années-lumière. Avec environ 40 milliards d\'étoiles, elle fait environ la moitié de la taille de notre Voie Lactée. Remarquez ses bras spiraux bleus distinctifs parsemés de régions roses de formation d\'étoiles.',
    },
    duration: 10,
    // Tilted view to see spiral structure with depth - closer zoom
    cameraPosition: [60000 * UNITS.KM_PER_LY, 50000 * UNITS.KM_PER_LY, 80000 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'localGroup',
  },
  {
    id: 'whirlpool',
    locationId: 'whirlpool',
    title: {
      en: 'Whirlpool Galaxy (M51)',
      fr: 'La Galaxie du Tourbillon (M51)',
    },
    narration: {
      en: 'The Whirlpool Galaxy, 23 million light-years away, was the first galaxy where spiral structure was observed in 1845. Its dramatic arms are being pulled by gravitational interaction with its smaller companion galaxy NGC 5195, creating one of the most photogenic pairs in the cosmos.',
      fr: 'La Galaxie du Tourbillon, à 23 millions d\'années-lumière, fut la première galaxie où la structure spirale fut observée en 1845. Ses bras spectaculaires sont étirés par l\'interaction gravitationnelle avec sa petite compagne NGC 5195, créant l\'une des paires les plus photogéniques du cosmos.',
    },
    duration: 10,
    // Tilted view to see spiral arms with depth and companion - close zoom
    cameraPosition: [50000 * UNITS.KM_PER_LY, 60000 * UNITS.KM_PER_LY, 70000 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'localGroup',
  },
  {
    id: 'sombrero',
    locationId: 'sombrero',
    title: {
      en: 'Sombrero Galaxy (M104)',
      fr: 'La Galaxie du Sombrero (M104)',
    },
    narration: {
      en: 'The Sombrero Galaxy, at 29 million light-years, is famous for its distinctive hat-like appearance. Its bright nucleus, unusually large central bulge, and dark dust lane create one of the most iconic galaxy silhouettes. It contains around 100 billion stars and possibly a supermassive black hole at its center.',
      fr: 'La Galaxie du Sombrero, à 29 millions d\'années-lumière, est célèbre pour son apparence distinctive de chapeau mexicain. Son noyau brillant, son bulbe central exceptionnellement grand et sa bande de poussière sombre créent l\'une des silhouettes de galaxie les plus emblématiques. Elle contient environ 100 milliards d\'étoiles et possiblement un trou noir supermassif en son centre.',
    },
    duration: 10,
    // Classic sombrero edge-on view - see the hat shape with dust lane
    cameraPosition: [60000 * UNITS.KM_PER_LY, 12000 * UNITS.KM_PER_LY, 40000 * UNITS.KM_PER_LY],
    lookAt: [0, 0, 0],
    scaleLevel: 'localGroup',
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
    // Same view as intro - increased distance for mobile
    cameraPosition: [0, 25000, 75000],
    lookAt: [0, 0, 0],
    scaleLevel: 'earth',
  },
];
