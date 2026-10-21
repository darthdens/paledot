import { useLanguage } from '@/i18n/LanguageContext';
import { useSiteBrand } from '@/lib/site-brand';
import { Button } from '@/components/ui/button';
import { Globe, X, MapPin, Heart } from 'lucide-react';
import portraitImg from '@/assets/dens-portrait.jpg';

const APP_VERSION = '1.0.0';

// Profile picture (bundled with the app)
const PROFILE_PIC = portraitImg;

// Social links
const SOCIAL_LINKS = {
  website: 'https://dens.so',
  twitter: 'https://x.com/densecho',
  linkedin: 'https://www.linkedin.com/in/denisakoka/',
  telegram: 'https://t.me/densakoka',
  instagram: 'https://www.instagram.com/densakoka/',
  facebook: 'https://www.facebook.com/densgpt/',
};

// Changelog data
const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2025-01-12',
    changes_en: [
      'Initial release of Cosmos Explorer',
      'Interactive 3D solar system with all planets and major moons',
      'Realistic orbital mechanics and rotation periods',
      'Accurate axial tilts for all celestial bodies',
      'Guided tour feature',
      'Multi-language support (English/French)',
    ],
    changes_fr: [
      'Version initiale de Cosmos Explorer',
      'Système solaire 3D interactif avec toutes les planètes et lunes majeures',
      'Mécanique orbitale et périodes de rotation réalistes',
      'Inclinaisons axiales précises pour tous les corps célestes',
      'Fonctionnalité de visite guidée',
      'Support multilingue (Anglais/Français)',
    ],
  },
];

const translations = {
  en: {
    about: 'About',
    version: 'Version',
    createdBy: 'Created by',
    bioPart1: "Multidisciplinary creative with 8+ years of experience at the intersection of design, technology, and marketing. Co-Founder at",
    bioPart2: "I'm also a huge space fan and nerd — I love everything about it, its terrifying scale, and how it grounds and humbles us.",
    location: 'Dundee, Scotland',
    description: 'An interactive 3D exploration of our solar system and beyond. Navigate through planets, moons, and distant galaxies with scientifically accurate data.',
    visitWebsite: 'Website',
    changelog: 'Changelog',
    features: 'Key Features',
    featuresList: [
      'Solar system with planets, moons & asteroids',
      'Distant galaxies, nebulae & star systems',
      'Realistic orbital mechanics & axial tilts',
      'Guided tours & educational info',
    ],
    close: 'Close',
    connect: 'Connect',
    madeWithLove: 'Made with',
    by: 'by',
    techStack: 'Tech Stack',
    credits: 'Credits & Data',
    creditsList: [
      'Planet textures from NASA',
      'Astronomical data from NASA/JPL',
      'Built with React Three Fiber',
    ],
  },
  fr: {
    about: 'À propos',
    version: 'Version',
    createdBy: 'Créé par',
    bioPart1: "Créatif pluridisciplinaire avec plus de 8 ans d'expérience à l'intersection du design, de la technologie et du marketing. Co-fondateur d'",
    bioPart2: "Je suis aussi un grand fan de l'espace — j'aime tout ce qui le concerne, son échelle terrifiante, et comment il nous ancre et nous rend humbles.",
    location: 'Dundee, Écosse',
    description: "Une exploration 3D interactive de notre système solaire et au-delà. Naviguez à travers les planètes, lunes et galaxies avec des données scientifiquement précises.",
    visitWebsite: 'Site web',
    changelog: 'Historique',
    features: 'Fonctionnalités',
    featuresList: [
      'Système solaire avec planètes, lunes et astéroïdes',
      'Galaxies lointaines, nébuleuses et systèmes stellaires',
      'Mécanique orbitale et inclinaisons réalistes',
      'Visites guidées et infos éducatives',
    ],
    close: 'Fermer',
    connect: 'Contact',
    madeWithLove: 'Fait avec',
    by: 'par',
    techStack: 'Technologies',
    credits: 'Crédits & Données',
    creditsList: [
      'Textures des planètes de la NASA',
      'Données astronomiques de NASA/JPL',
      'Construit avec React Three Fiber',
    ],
  },
};

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  const { language } = useLanguage();
  const brand = useSiteBrand();
  const t = translations[language];
  const currentYear = new Date().getFullYear();

  if (!open) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-[20000] p-3 animate-fade-in overflow-y-auto">
      {/* Close button */}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center space-y-4 sm:space-y-5 max-w-sm sm:max-w-2xl px-4 py-6 my-auto">
        {/* Header - no emoji */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {brand === 'paledot' ? 'Pale Dot' : 'Cosmos Explorer'}
          </h1>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            {t.description}
          </p>
          <span className="inline-block px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
            {t.version} {APP_VERSION}
          </span>
        </div>

        {/* Content boxes with consistent spacing */}
        <div className="space-y-3">
          {/* Creator section - prominent */}
          <div className="bg-white/10 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={PROFILE_PIC}
                alt="Dens Akoka"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20"
              />
              <div className="text-left flex-1">
                <p className="text-xs text-white/50">{t.createdBy}</p>
                <p className="font-bold text-white text-lg sm:text-xl">Dens Akoka</p>
                <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{t.location}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-white/70 text-left leading-relaxed">
              {t.bioPart1}{' '}
              <a
                href="https://echoai.so"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              >
                Echo AI
              </a>
              . {t.bioPart2}
            </p>
            
            {/* Social links */}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={SOCIAL_LINKS.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-full text-xs text-blue-300 hover:text-blue-200 transition-colors font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                {t.visitWebsite}
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href={SOCIAL_LINKS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            </div>
          </div>

          {/* Features & Changelog grid */}
          <div className="grid gap-3 text-left grid-cols-1 sm:grid-cols-2">
          {/* Features */}
          <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-1.5">
            <p className="text-white/90 font-medium text-sm">{t.features}</p>
            {t.featuresList.map((feature, index) => (
              <p key={index} className="text-white/60 text-xs">• {feature}</p>
            ))}
          </div>

          {/* Changelog */}
          <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-2">
            <p className="text-white/90 font-medium text-sm">{t.changelog}</p>
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-[4px]">
                    v{entry.version}
                  </span>
                  <span className="text-white/40 text-[10px]">{entry.date}</span>
                </div>
                <ul className="space-y-0.5">
                  {(language === 'fr' ? entry.changes_fr : entry.changes_en).slice(0, 3).map((change, idx) => (
                    <li key={idx} className="text-white/50 text-[11px]">• {change}</li>
                  ))}
                  {(language === 'fr' ? entry.changes_fr : entry.changes_en).length > 3 && (
                    <li className="text-white/40 text-[11px]">+ {(language === 'fr' ? entry.changes_fr : entry.changes_en).length - 3} more...</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          </div>
          
          {/* Tech Stack & Credits grid */}
          <div className="grid gap-3 text-left grid-cols-1 sm:grid-cols-2">
            {/* Tech Stack */}
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-2">
              <p className="text-white/90 font-medium text-sm">{t.techStack}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-[4px]">React</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-[4px]">TypeScript</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-[4px]">Three.js</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-medium rounded-[4px]">Tailwind CSS</span>
                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-[10px] font-medium rounded-[4px]">Vite</span>
                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-[10px] font-medium rounded-[4px]">Zustand</span>
              </div>
            </div>

            {/* Credits */}
            <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-1.5">
              <p className="text-white/90 font-medium text-sm">{t.credits}</p>
              {t.creditsList.map((credit, index) => (
                <p key={index} className="text-white/60 text-xs">• {credit}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Made with love badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-white/50">
          <span>{t.madeWithLove}</span>
          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>{t.by}</span>
          <a
            href={SOCIAL_LINKS.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white underline underline-offset-2 transition-colors"
          >
            Dens Akoka
          </a>
        </div>

        {/* Close button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="text-xs sm:text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
        >
          {t.close}
        </Button>

        {/* Copyright - dynamic year */}
        <p className="text-[11px] text-white/30">
          © {currentYear} Dens Akoka
        </p>
      </div>
    </div>
  );
};
