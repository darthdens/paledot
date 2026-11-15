import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { celestialObjects } from '../data/celestialObjects';
import { useCosmosStore } from '../store/useCosmosStore';
import { cn } from '@/lib/utils';
import { useSiteBrand } from '@/lib/site-brand';
import { getHardware } from '@/features/left-behind/data/dataClient';
import { visitMachine } from '@/features/left-behind/lib/hardwareNavigation';
import { dataText } from '@/features/left-behind/lib/dataText';
import type { Machine } from '@/features/left-behind/data/types';

const translations = {
  en: {
    placeholder: 'Search celestial objects...',
    noResults: 'No objects found',
    planet: 'Planet',
    moon: 'Moon',
    star: 'Star',
    nebula: 'Nebula',
    galaxy: 'Galaxy',
    'dwarf-planet': 'Dwarf Planet',
  },
  fr: {
    placeholder: 'Rechercher des objets célestes...',
    noResults: 'Aucun objet trouvé',
    planet: 'Planète',
    moon: 'Lune',
    star: 'Étoile',
    nebula: 'Nébuleuse',
    galaxy: 'Galaxie',
    'dwarf-planet': 'Planète naine',
  },
};

interface ObjectSearchProps {
  isFullscreen: boolean;
}

export const ObjectSearch = ({ isFullscreen }: ObjectSearchProps) => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const brand = useSiteBrand();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedObject, stopTour } = useCosmosStore();
  useEffect(() => {
    if (!isOpen || brand !== 'paledot') return;
    let alive = true;
    void getHardware().then(h => { if (alive) setMachines(h.machines); }).catch(() => {});
    return () => { alive = false; };
  }, [isOpen, brand]);
  const filteredMachines = query.trim() ? machines.filter(m => `${m.name} ${dataText(m.name, language)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : [];

  // Filter celestial objects by name
  const filteredObjects = celestialObjects.filter((obj) => {
    if (!query.trim()) return false;
    const name = tr(obj.name).toLowerCase();
    return name.includes(query.toLowerCase());
  });

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard shortcut: Ctrl/Cmd + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (obj: typeof celestialObjects[number]) => {
    stopTour();
    setSelectedObject(obj);
    setIsOpen(false);
    setQuery('');
  };

  const getTypeLabel = (type: string) => {
    return t[type as keyof typeof t] || type;
  };

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="h-7 w-7 sm:h-9 sm:w-9 bg-white/10 hover:bg-white/20 text-white"
        title="Search (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
      </Button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'z-[10001] bg-black/90 backdrop-blur-xs rounded-lg shadow-lg border border-white/20',
        isFullscreen ? 'fixed' : 'absolute',
        'top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-auto w-auto sm:w-80'
      )}
      style={
        isFullscreen
          ? {
              top: 'calc(0.5rem + env(safe-area-inset-top))',
              left: 'calc(0.5rem + env(safe-area-inset-left))',
              right: 'calc(0.5rem + env(safe-area-inset-right))',
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 p-2">
        <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            setQuery('');
          }}
          className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {query.trim() && (
        <div className="max-h-60 overflow-y-auto border-t border-white/10">
          {filteredObjects.length === 0 && filteredMachines.length === 0 ? (
            <p className="text-white/50 text-sm p-3 text-center">{t.noResults}</p>
          ) : (
            <ul>
              {filteredMachines.map(machine => <li key={machine.id}><Button variant="ghost" className="h-auto min-h-11 w-full justify-start whitespace-normal px-3 py-2 text-left font-normal text-foreground" onClick={() => { void visitMachine(machine); setIsOpen(false); setQuery(''); }}>{dataText(machine.name, language)}</Button></li>)}
              {filteredObjects.map((obj) => (
                <li key={obj.id}>
                  <button
                    onClick={() => handleSelect(obj)}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="text-white text-sm truncate">
                      {tr(obj.name)}
                    </span>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {getTypeLabel(obj.type)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
