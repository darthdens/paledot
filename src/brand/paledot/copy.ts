/** Pale Dot copy. FR lines marked "review" were drafted by Claude, not by Dens. */
export const PALEDOT_COPY = {
  en: {
    name: "Pale Dot",
    descriptor: "From Earth to the edge of everything",
    begin: "Begin at Earth",
    again: "Go again",
    share: "Share",
    home: "Back to Earth",
    copied: "Link copied",
    shareOn: "Share on",
    shareMessage: "I just travelled from Earth to the edge of the observable universe on Pale Dot.",
    copiedForInstagram: "Link copied. Paste it in Instagram.",
    credit: "by",
    author: "Dens Akoka",
    loading: "Loading",
    loadingNote: "Textures, galaxies and shaders. It takes a moment.",
    skipLoading: "Skip loading",
    distanceLabel: "Distance from Earth",
    youAreHere: "You are here",
    earthLocation: "Earth · 1 AU from the Sun",
    scaleLabel: "Scale",
    reached: "You reached",
    edge: "The edge of the observable universe",
    // Optional About copy. Factual, no "pale blue dot" wording, no Sagan quotes.
    about1:
      "Pale Dot is an interactive 3D journey. It starts on Earth and zooms out through the Solar System, the Milky Way, the Local Group and the cosmic web, all the way to the edge of the observable universe, 46.5 billion light-years away.",
    about2: "Built by Dens Akoka for students, teachers and anyone who wants to feel how big it all is.",
    cookies: {
      label: "Cookies",
      message: "Pale Dot uses cookies to count visits and improve the journey. Nothing is sold or shared.",
      privacy: "Privacy",
      accept: "Accept",
      decline: "Decline",
    },
  },
  fr: {
    name: "Pale Dot",
    descriptor: "De la Terre aux confins de tout", // review
    begin: "Commencer sur Terre", // review
    again: "Recommencer",
    share: "Partager",
    home: "Retour sur Terre",
    copied: "Lien copié",
    shareOn: "Partager sur",
    shareMessage: "Je viens de voyager de la Terre jusqu'au bord de l'univers observable sur Pale Dot.",
    copiedForInstagram: "Lien copié. Collez-le dans Instagram.",
    credit: "par",
    author: "Dens Akoka",
    loading: "Chargement",
    loadingNote: "Textures, galaxies et shaders. Ça prend un instant.", // review
    skipLoading: "Passer le chargement",
    distanceLabel: "Distance depuis la Terre",
    youAreHere: "Vous êtes ici",
    earthLocation: "Terre · 1 UA du Soleil",
    scaleLabel: "Échelle",
    reached: "Vous avez atteint",
    edge: "Le bord de l'univers observable",
    about1:
      "Pale Dot est un voyage 3D interactif. Il commence sur Terre et s'éloigne à travers le Système solaire, la Voie lactée, le Groupe local et la toile cosmique, jusqu'au bord de l'univers observable, à 46,5 milliards d'années-lumière.", // review
    about2: "Créé par Dens Akoka pour les élèves, les enseignants et tous ceux qui veulent sentir à quel point tout cela est grand.", // review
    cookies: {
      label: "Cookies",
      message: "Pale Dot utilise des cookies pour compter les visites et améliorer le voyage. Rien n'est vendu ni partagé.", // review
      privacy: "Confidentialité",
      accept: "Accepter",
      decline: "Refuser",
    },
  },
} as const;

export type PaleDotLang = keyof typeof PALEDOT_COPY;
