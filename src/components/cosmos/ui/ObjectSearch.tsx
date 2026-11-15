import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { celestialObjects } from '../data/celestialObjects';
import { useCosmosStore } from '../store/useCosmosStore';
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
  onOpen?: () => void;
}

export const ObjectSearch = ({ onOpen }: ObjectSearchProps) => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const t = tr(translations);
  const brand = useSiteBrand();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openSearch = () => { onOpen?.(); setIsOpen(true); };
  const closeSearch = () => { setIsOpen(false); setQuery(''); triggerRef.current?.focus(); };
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
        onOpen?.(); setIsOpen(true);
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

  return (
    <div ref={containerRef} data-search-slot className="relative h-11 w-11 shrink-0" data-search-open={isOpen}>
      <div data-object-search={isOpen ? '' : undefined} className="cosmos-search-field">
        <Button ref={triggerRef} size="icon" variant="ghost" onClick={() => isOpen ? closeSearch() : openSearch()} aria-label={t.placeholder} title={t.placeholder} aria-expanded={isOpen} data-search-trigger className="h-11 w-11 shrink-0 bg-foreground/10 hover:bg-foreground/20 text-foreground"><Search className="h-5 w-5" /></Button>
        <div className="cosmos-search-input" inert={!isOpen}>
        <Input
          ref={inputRef}
          type="text"
          aria-label={t.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground h-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={closeSearch}
          aria-label={tx("Close", "Fermer")}
          className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-foreground/10"
        >
          <X className="w-4 h-4" />
        </Button>
        </div>
      </div>

      {isOpen && query.trim() && (
        <div data-search-results className="absolute left-0 top-[52px] w-full min-w-64 max-h-60 overflow-y-auto border border-border bg-card text-foreground rounded-lg">
          {filteredObjects.length === 0 && filteredMachines.length === 0 ? (
            <p className="text-white/50 text-sm p-3 text-center">{t.noResults}</p>
          ) : (
            <ul>
              {filteredMachines.map(machine => <li key={machine.id}><Button variant="ghost" className="h-auto min-h-11 w-full justify-start whitespace-normal px-3 py-2 text-left font-normal text-foreground" onClick={() => { void visitMachine(machine); setIsOpen(false); setQuery(''); }}>{dataText(machine.name, language)}</Button></li>)}
              {filteredObjects.map((obj) => (
                <li key={obj.id}>
                  <Button variant="ghost"
                    onClick={() => handleSelect(obj)}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="text-white text-sm truncate">
                      {tr(obj.name)}
                    </span>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {getTypeLabel(obj.type)}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
