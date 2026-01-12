import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, X } from 'lucide-react';

const APP_VERSION = '1.0.0';

// Social links
const SOCIAL_LINKS = {
  website: 'https://dens.so',
  github: 'https://github.com/densmusic',
  twitter: 'https://x.com/AkokaDens',
  linkedin: 'https://linkedin.com/in/densmusic',
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
    about: 'About Cosmos Explorer',
    version: 'Version',
    createdBy: 'Created by',
    description: 'An interactive 3D exploration of our solar system and beyond. Navigate through planets, moons, and distant galaxies with scientifically accurate data.',
    visitWebsite: 'Website',
    changelog: 'Changelog',
    features: 'Key Features',
    featuresList: [
      'Realistic planetary rotations and axial tilts',
      'Accurate orbital periods and distances',
      'Interactive camera controls',
      'Educational info for each celestial body',
    ],
    close: 'Close',
    followMe: 'Follow me',
  },
  fr: {
    about: 'À propos de Cosmos Explorer',
    version: 'Version',
    createdBy: 'Créé par',
    description: "Une exploration 3D interactive de notre système solaire et au-delà. Naviguez à travers les planètes, lunes et galaxies avec des données scientifiquement précises.",
    visitWebsite: 'Site web',
    changelog: 'Historique des versions',
    features: 'Fonctionnalités clés',
    featuresList: [
      'Rotations planétaires et inclinaisons axiales réalistes',
      'Périodes orbitales et distances précises',
      'Contrôles de caméra interactifs',
      'Infos éducatives pour chaque corps céleste',
    ],
    close: 'Fermer',
    followMe: 'Me suivre',
  },
};

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  const { language } = useLanguage();
  const t = translations[language];

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

      <div className="text-center space-y-4 sm:space-y-6 max-w-sm sm:max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl">🌌</span>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
              {t.about}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
              {t.version} {APP_VERSION}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto">
          {t.description}
        </p>

        {/* Main content grid */}
        <div className="grid gap-3 text-left grid-cols-1 sm:grid-cols-2">
          {/* Creator section */}
          <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-base sm:text-lg font-bold text-white">
                DA
              </div>
              <div>
                <p className="text-xs text-white/50">{t.createdBy}</p>
                <p className="font-semibold text-white text-sm sm:text-base">Dens Akoka</p>
              </div>
            </div>
            
            {/* Social links */}
            <div className="space-y-2">
              <p className="text-xs text-white/50">{t.followMe}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={SOCIAL_LINKS.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white/80 hover:text-white transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {t.visitWebsite}
                </a>
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white/80 hover:text-white transition-colors"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-1.5">
            <p className="text-white/90 font-medium text-sm sm:text-base">{t.features}:</p>
            {t.featuresList.map((feature, index) => (
              <p key={index} className="text-white/70 text-xs sm:text-sm">• {feature}</p>
            ))}
          </div>
        </div>

        {/* Changelog section */}
        <div className="bg-white/10 rounded-lg p-3 sm:p-4 text-left">
          <p className="text-white/90 font-medium text-sm sm:text-base mb-3">{t.changelog}</p>
          <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
                    v{entry.version}
                  </span>
                  <span className="text-white/50 text-xs">{entry.date}</span>
                </div>
                <ul className="space-y-0.5 pl-1">
                  {(language === 'fr' ? entry.changes_fr : entry.changes_en).map((change, idx) => (
                    <li key={idx} className="text-white/60 text-xs flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs sm:text-sm bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            {t.close}
          </Button>
        </div>

        {/* Copyright */}
        <p className="text-xs text-white/40">
          © 2025 Dens Akoka. All rights reserved.
        </p>
      </div>
    </div>
  );
};
