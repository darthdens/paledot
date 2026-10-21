import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useLanguage } from '@/i18n/LanguageContext';
import { UNITS } from '../types';

interface ScaleBarProps {
  // Optional: provide camera distance directly if not using within Canvas
  cameraDistance?: number;
}

const translations = {
  en: {
    km: 'km',
    au: 'AU',
    ly: 'light-years',
    kly: 'thousand light-years',
    mly: 'million light-years',
    bly: 'billion light-years',
  },
  fr: {
    km: 'km',
    au: 'UA',
    ly: 'années-lumière',
    kly: 'milliers d\'années-lumière',
    mly: 'millions d\'années-lumière',
    bly: 'milliards d\'années-lumière',
  },
};

// Scale bar widths and their real-world equivalents at different zoom levels
const SCALE_LEVELS = [
  { maxDistance: 1000, scaleKm: 100, label: (t: typeof translations.en) => `100 ${t.km}` },
  { maxDistance: 10000, scaleKm: 1000, label: (t: typeof translations.en) => `1,000 ${t.km}` },
  { maxDistance: 100000, scaleKm: 10000, label: (t: typeof translations.en) => `10,000 ${t.km}` },
  { maxDistance: 1000000, scaleKm: 100000, label: (t: typeof translations.en) => `100,000 ${t.km}` },
  { maxDistance: 1e7, scaleKm: 1e6, label: (t: typeof translations.en) => `1M ${t.km}` },
  { maxDistance: 1e8, scaleKm: 1e7, label: (t: typeof translations.en) => `10M ${t.km}` },
  { maxDistance: UNITS.KM_PER_AU * 0.5, scaleKm: UNITS.KM_PER_AU * 0.1, label: (t: typeof translations.en) => `0.1 ${t.au}` },
  { maxDistance: UNITS.KM_PER_AU * 2, scaleKm: UNITS.KM_PER_AU, label: (t: typeof translations.en) => `1 ${t.au}` },
  { maxDistance: UNITS.KM_PER_AU * 20, scaleKm: UNITS.KM_PER_AU * 10, label: (t: typeof translations.en) => `10 ${t.au}` },
  { maxDistance: UNITS.KM_PER_AU * 200, scaleKm: UNITS.KM_PER_AU * 100, label: (t: typeof translations.en) => `100 ${t.au}` },
  { maxDistance: UNITS.KM_PER_LY * 0.1, scaleKm: UNITS.KM_PER_AU * 1000, label: (t: typeof translations.en) => `1,000 ${t.au}` },
  { maxDistance: UNITS.KM_PER_LY, scaleKm: UNITS.KM_PER_LY * 0.1, label: (t: typeof translations.en) => `0.1 ${t.ly}` },
  { maxDistance: UNITS.KM_PER_LY * 10, scaleKm: UNITS.KM_PER_LY, label: (t: typeof translations.en) => `1 ${t.ly}` },
  { maxDistance: UNITS.KM_PER_LY * 100, scaleKm: UNITS.KM_PER_LY * 10, label: (t: typeof translations.en) => `10 ${t.ly}` },
  { maxDistance: UNITS.KM_PER_LY * 1000, scaleKm: UNITS.KM_PER_LY * 100, label: (t: typeof translations.en) => `100 ${t.ly}` },
  { maxDistance: UNITS.KM_PER_LY * 10000, scaleKm: UNITS.KM_PER_LY * 1000, label: (t: typeof translations.en) => `1 ${t.kly}` },
  { maxDistance: UNITS.KM_PER_LY * 100000, scaleKm: UNITS.KM_PER_LY * 10000, label: (t: typeof translations.en) => `10 ${t.kly}` },
  { maxDistance: UNITS.KM_PER_LY * 1000000, scaleKm: UNITS.KM_PER_LY * 100000, label: (t: typeof translations.en) => `100 ${t.kly}` },
  // Local Group scale (~10 Mly)
  { maxDistance: UNITS.KM_PER_MLY * 10, scaleKm: UNITS.KM_PER_MLY, label: (t: typeof translations.en) => `1 ${t.mly}` },
  // Virgo Supercluster scale (~110 Mly)
  { maxDistance: UNITS.KM_PER_MLY * 100, scaleKm: UNITS.KM_PER_MLY * 10, label: (t: typeof translations.en) => `10 ${t.mly}` },
  { maxDistance: UNITS.KM_PER_MLY * 500, scaleKm: UNITS.KM_PER_MLY * 100, label: (t: typeof translations.en) => `100 ${t.mly}` },
  // Laniakea scale (~520 Mly)
  { maxDistance: UNITS.KM_PER_BLY * 1, scaleKm: UNITS.KM_PER_MLY * 500, label: (t: typeof translations.en) => `500 ${t.mly}` },
  // Observable universe scale
  { maxDistance: UNITS.KM_PER_BLY * 10, scaleKm: UNITS.KM_PER_BLY, label: (t: typeof translations.en) => `1 ${t.bly}` },
  { maxDistance: UNITS.KM_PER_BLY * 50, scaleKm: UNITS.KM_PER_BLY * 10, label: (t: typeof translations.en) => `10 ${t.bly}` },
  { maxDistance: UNITS.KM_PER_BLY * 100, scaleKm: UNITS.KM_PER_BLY * 50, label: (t: typeof translations.en) => `50 ${t.bly}` },
];

// Component to be rendered inside the Canvas (has access to useThree)
export const ScaleBarInner = () => {
  const { camera } = useThree();
  const [distance, setDistance] = useState(0);
  
  useEffect(() => {
    const updateDistance = () => {
      // Camera distance from origin, converted back to km
      const distKm = camera.position.length() / 0.001; // UNIFIED_SCALE = 0.001
      setDistance(distKm);
    };
    
    // Update on animation frame
    const interval = setInterval(updateDistance, 100);
    updateDistance();
    
    return () => clearInterval(interval);
  }, [camera]);
  
  // Store distance in a global for the UI overlay to read
  useEffect(() => {
    (window as any).__cosmosScaleDistance = distance;
  }, [distance]);
  
  return null;
};

// UI component to be rendered outside the Canvas
export const ScaleBarUI = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [distance, setDistance] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const d = (window as any).__cosmosScaleDistance || 0;
      setDistance(d);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Find appropriate scale level
  const scaleLevel = SCALE_LEVELS.find(level => distance < level.maxDistance) || SCALE_LEVELS[SCALE_LEVELS.length - 1];
  
  // Calculate bar width in pixels (roughly 100px as base)
  const barWidth = 120;
  
  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-xs rounded-lg px-3 py-2 border border-white/10">
        {/* Scale bar */}
        <div className="flex items-center gap-2">
          <div 
            className="h-1 bg-white/80 rounded-full relative"
            style={{ width: `${barWidth}px` }}
          >
            {/* End caps */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/80" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/80" />
          </div>
        </div>
        
        {/* Scale label */}
        <div className="text-xs text-white/70 mt-1 text-center">
          {scaleLevel.label(t)}
        </div>
      </div>
    </div>
  );
};
