// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/i18n/LanguageContext';
import { leftBehindCopy } from '../lib/copy';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { TourChoices } from './TourChoices';
import { machineCopy } from '../lib/machineCopy';
export function LeftBehindMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [toursOpen, setToursOpen] = useState(false);
  const { language, tr } = useLanguage();
  const copy = leftBehindCopy[language];
  const text = (value: string) => tr({ en: value, fr: value });
  const machinesVisible = useLeftBehindStore(s => s.machinesVisible);
  const fullPathsVisible = useLeftBehindStore(s => s.fullPathsVisible);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && !ref.current?.contains(event.target) && !event.target.closest('[data-lb-menu-trigger]')) useLeftBehindStore.getState().setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') useLeftBehindStore.getState().setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return <div ref={ref} data-lb-menu role="region" aria-label={text(copy.name)} className="pd-card rounded-lg absolute top-12 right-2 sm:top-[60px] sm:right-4 z-[10002] w-[min(300px,calc(100vw-1rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-foreground/10 backdrop-blur-xs p-2">
    <Button variant="ghost" aria-expanded={toursOpen} onClick={() => setToursOpen(!toursOpen)} className="w-full min-h-11 justify-between px-3 text-sm"><span>{text(copy.tours)}</span><ChevronDown className={`h-4 w-4 ${toursOpen ? 'rotate-180' : ''}`} /></Button>
    {toursOpen && <TourChoices onBegin={() => { useLeftBehindStore.getState().setMenuOpen(false); useCosmosStore.getState().startTour(); }} />}
    <div className="my-1 border-t border-border" />
    <label className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-sm text-foreground hover:bg-accent/40">
      <span>{text(copy.machines)}</span><Switch className="pd-machine-switch" aria-label={text(copy.machines)} checked={machinesVisible} onCheckedChange={() => useLeftBehindStore.getState().toggleMachines()} />
    </label>
    <label className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-sm text-foreground hover:bg-accent/40">
      <span>{machineCopy[language].full}</span><Switch className="pd-machine-switch" aria-label={machineCopy[language].full} checked={fullPathsVisible} onCheckedChange={() => useLeftBehindStore.getState().toggleFullPaths()} />
    </label>
    <div className="my-1 border-t border-border" />
    <Button variant="ghost" disabled className="w-full min-h-11 justify-start px-3 text-sm">{text(copy.signal)}</Button>
    <Button variant="ghost" disabled className="w-full min-h-11 justify-start px-3 text-sm">{text(copy.know)}</Button>
  </div>;
}