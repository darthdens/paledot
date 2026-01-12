import { useLanguage } from '@/i18n/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Globe, Heart } from 'lucide-react';

const APP_VERSION = '1.0.0';

const translations = {
  en: {
    about: 'About',
    version: 'Version',
    createdBy: 'Created by',
    description: 'An interactive 3D exploration of our solar system and beyond. Navigate through planets, moons, and distant galaxies with scientifically accurate data and realistic orbital mechanics.',
    visitWebsite: 'Visit Website',
    features: 'Features',
    featuresList: [
      'Realistic planetary rotations and axial tilts',
      'Accurate orbital periods and distances',
      'Interactive camera controls',
      'Educational information for each celestial body',
    ],
    builtWith: 'Built with',
    techStack: 'React, Three.js, and a passion for space exploration',
    copyright: '© 2025 Dens Akoka. All rights reserved.',
  },
  fr: {
    about: 'À propos',
    version: 'Version',
    createdBy: 'Créé par',
    description: "Une exploration 3D interactive de notre système solaire et au-delà. Naviguez à travers les planètes, les lunes et les galaxies lointaines avec des données scientifiquement précises et une mécanique orbitale réaliste.",
    visitWebsite: 'Visiter le site',
    features: 'Fonctionnalités',
    featuresList: [
      'Rotations planétaires et inclinaisons axiales réalistes',
      'Périodes orbitales et distances précises',
      'Contrôles de caméra interactifs',
      'Informations éducatives pour chaque corps céleste',
    ],
    builtWith: 'Construit avec',
    techStack: "React, Three.js, et une passion pour l'exploration spatiale",
    copyright: '© 2025 Dens Akoka. Tous droits réservés.',
  },
};

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a1a]/95 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🌌</span> Cosmos Explorer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Version badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
              {t.version} {APP_VERSION}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 leading-relaxed">
            {t.description}
          </p>

          {/* Creator section */}
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                DA
              </div>
              <div>
                <p className="text-xs text-white/50">{t.createdBy}</p>
                <p className="font-semibold text-white">Dens Akoka</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
              onClick={() => window.open('https://dens.so', '_blank')}
            >
              <Globe className="w-4 h-4 mr-2" />
              {t.visitWebsite}
              <ExternalLink className="w-3 h-3 ml-2 opacity-50" />
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white/80">{t.features}</h4>
            <ul className="space-y-1.5">
              {t.featuresList.map((feature, index) => (
                <li key={index} className="text-xs text-white/60 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Built with */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Heart className="w-3 h-3 text-red-400" />
            <span>{t.builtWith} {t.techStack}</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
            {t.copyright}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
