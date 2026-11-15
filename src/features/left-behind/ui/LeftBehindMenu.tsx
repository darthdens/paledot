// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { JumpCategory } from './JumpCategory';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/i18n/LanguageContext';
import { leftBehindCopy } from '../lib/copy';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { TourChoices } from './TourChoices';
import { machineCopy } from '../lib/machineCopy';
import { useSignal } from '../state/useSignal';
export function LeftBehindMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [toursOpen, setToursOpen] = useState(true);
  const { language, tr, tx } = useLanguage();
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
  const row = 'w-full h-auto min-h-7 max-sm:min-h-11 flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-[4px] text-xs sm:text-sm text-foreground hover:bg-accent/60 cursor-pointer';
  return <div ref={ref} data-lb-menu role="region" aria-label={text(copy.name)} className="absolute top-12 right-2 sm:top-[60px] sm:right-4 z-[10002] w-[calc(100vw-1rem)] max-w-56 sm:max-w-64 max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white/10 backdrop-blur-xs rounded-lg animate-scale-in origin-top-right">
    <div className="flex items-center justify-between p-2 sm:p-3 border-b border-white/10">
      <h3 className="text-foreground font-semibold text-sm">{text(copy.name)}</h3>
      <Button size="icon" variant="ghost" aria-label={tx('Close', 'Fermer')} onClick={() => useLeftBehindStore.getState().setMenuOpen(false)} className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></Button>
    </div>
    <div className="p-2 [&>*:last-child]:mb-0">
      <JumpCategory title={text(copy.tours)} expanded={toursOpen} onToggle={() => setToursOpen(!toursOpen)}>
        <TourChoices onBegin={id => { useLeftBehindStore.getState().setMenuOpen(false); useCosmosStore.getState().setShowControlHints(false); useCosmosStore.getState().startTour(id); }} />
      </JumpCategory>
      <div className="my-2 border-t border-white/10" />
      <label className={row}>
        <span>{text(copy.machines)}</span><Switch className="pd-machine-switch" aria-label={text(copy.machines)} checked={machinesVisible} onCheckedChange={() => useLeftBehindStore.getState().toggleMachines()} />
      </label>
      <label className={row}>
        <span>{machineCopy[language].full}</span><Switch className="pd-machine-switch" aria-label={machineCopy[language].full} checked={fullPathsVisible} onCheckedChange={() => useLeftBehindStore.getState().toggleFullPaths()} />
      </label>
      <div className="my-2 border-t border-white/10" />
      <Button variant="ghost" onClick={() => useSignal.getState().show()} className={`${row} justify-start font-normal`}>{text(copy.signal)}</Button>
      <Button variant="ghost" disabled className={`${row} justify-start font-normal`}>{text(copy.know)}</Button>
    </div>
  </div>;
}
