import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useCosmosStore } from '../store/useCosmosStore';
import { useFullscreenStore } from '../store/useFullscreenStore';
import { celestialObjects } from '../data/celestialObjects';
import { useMemo, useState } from 'react';

const translations = {
  en: {
    title: 'Size Comparison',
    subtitle: 'Planets and moons shown to scale',
    sun: 'Sun (scaled down 10×)',
    diameter: 'Diameter',
    selectObjects: 'Select objects to compare',
    planets: 'Planets',
    moons: 'Major Moons',
    dwarfPlanets: 'Dwarf Planets',
  },
  fr: {
    title: 'Comparaison des Tailles',
    subtitle: 'Planètes et lunes à l\'échelle',
    sun: 'Soleil (réduit 10×)',
    diameter: 'Diamètre',
    selectObjects: 'Sélectionner les objets à comparer',
    planets: 'Planètes',
    moons: 'Lunes Majeures',
    dwarfPlanets: 'Planètes Naines',
  },
};

// Size data in km
const COMPARISON_OBJECTS = [
  { id: 'sun', name: { en: 'Sun', fr: 'Soleil' }, size: 1392700, color: '#FDB813', scaleDown: 10 },
  { id: 'jupiter', name: { en: 'Jupiter', fr: 'Jupiter' }, size: 139820, color: '#d8ca9d' },
  { id: 'saturn', name: { en: 'Saturn', fr: 'Saturne' }, size: 116460, color: '#ead6b8' },
  { id: 'uranus', name: { en: 'Uranus', fr: 'Uranus' }, size: 50724, color: '#d1e7e7' },
  { id: 'neptune', name: { en: 'Neptune', fr: 'Neptune' }, size: 49244, color: '#5b7fde' },
  { id: 'earth', name: { en: 'Earth', fr: 'Terre' }, size: 12742, color: '#6b93d6' },
  { id: 'venus', name: { en: 'Venus', fr: 'Vénus' }, size: 12104, color: '#e6c35c' },
  { id: 'mars', name: { en: 'Mars', fr: 'Mars' }, size: 6779, color: '#c1440e' },
  { id: 'ganymede', name: { en: 'Ganymede', fr: 'Ganymède' }, size: 5268, color: '#9e9e9e' },
  { id: 'titan', name: { en: 'Titan', fr: 'Titan' }, size: 5150, color: '#e8a43c' },
  { id: 'mercury', name: { en: 'Mercury', fr: 'Mercure' }, size: 4879, color: '#8c8c8c' },
  { id: 'moon', name: { en: 'Moon', fr: 'Lune' }, size: 3474, color: '#c4c4c4' },
  { id: 'europa', name: { en: 'Europa', fr: 'Europe' }, size: 3122, color: '#c9b896' },
  { id: 'pluto', name: { en: 'Pluto', fr: 'Pluton' }, size: 2377, color: '#d4b896' },
  { id: 'ceres', name: { en: 'Ceres', fr: 'Cérès' }, size: 939, color: '#a0a0a0' },
];

export const SizeComparison = () => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const showSizeComparison = useCosmosStore(state => state.showSizeComparison);
  const toggleSizeComparison = useCosmosStore(state => state.toggleSizeComparison);
  const setSelectedObject = useCosmosStore(state => state.setSelectedObject);
  const isFullscreen = useFullscreenStore(state => state.isFullscreen);
  const [selectedIds, setSelectedIds] = useState<string[]>(['sun', 'jupiter', 'earth', 'moon']);

  // Find the maximum size for scaling (excluding sun's scaled-down size)
  const maxDisplaySize = useMemo(() => {
    const selected = COMPARISON_OBJECTS.filter(obj => selectedIds.includes(obj.id));
    return Math.max(...selected.map(obj => obj.scaleDown ? obj.size / obj.scaleDown : obj.size));
  }, [selectedIds]);

  const toggleObject = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleObjectClick = (id: string) => {
    const obj = celestialObjects.find(o => o.id === id);
    if (obj) {
      setSelectedObject(obj);
      toggleSizeComparison();
    }
  };

  if (!showSizeComparison) return null;

  const selectedObjects = COMPARISON_OBJECTS.filter(obj => selectedIds.includes(obj.id));

  return (
    <div 
      className={`${isFullscreen ? 'fixed' : 'absolute'} inset-0 bg-black/95 z-[10002] flex flex-col`}
      style={isFullscreen ? {
        top: 'calc(0.5rem + env(safe-area-inset-top))',
        bottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        left: 'calc(0.5rem + env(safe-area-inset-left))',
        right: 'calc(0.5rem + env(safe-area-inset-right))',
      } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-lg">{t.title}</h2>
          <p className="text-white/60 text-sm">{t.subtitle}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleSizeComparison}
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Object selector */}
      <div className="p-4 border-b border-white/10">
        <p className="text-white/60 text-xs mb-2">{t.selectObjects}</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPARISON_OBJECTS.map(obj => (
            <button
              key={obj.id}
              onClick={() => toggleObject(obj.id)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                selectedIds.includes(obj.id)
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
              style={selectedIds.includes(obj.id) ? { borderColor: obj.color, borderWidth: 1 } : undefined}
            >
              {tr(obj.name)}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison visualization */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-end justify-center gap-4 min-h-[300px] flex-wrap">
          {selectedObjects.map(obj => {
            const displaySize = obj.scaleDown ? obj.size / obj.scaleDown : obj.size;
            const heightPercent = (displaySize / maxDisplaySize) * 100;
            const minHeight = 20;
            const maxHeight = 200;
            const height = Math.max(minHeight, (heightPercent / 100) * maxHeight);
            
            return (
              <div 
                key={obj.id} 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleObjectClick(obj.id)}
              >
                {/* Planet circle */}
                <div
                  className="rounded-full mb-2 transition-all duration-300"
                  style={{
                    width: height,
                    height: height,
                    backgroundColor: obj.color,
                    boxShadow: `0 0 ${height / 4}px ${obj.color}66`,
                  }}
                />
                
                {/* Name */}
                <span className="text-white text-xs font-medium text-center">
                  {tr(obj.name)}
                  {obj.scaleDown && <span className="text-white/50 text-[10px] block">(÷{obj.scaleDown})</span>}
                </span>
                
                {/* Size */}
                <span className="text-white/50 text-[10px]">
                  {obj.size.toLocaleString(numberLocale)} km
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className="text-white/40 text-xs">
          {tx('Click an object to navigate to it', 'Cliquez sur un objet pour naviguer vers lui')}
        </p>
      </div>
    </div>
  );
};
