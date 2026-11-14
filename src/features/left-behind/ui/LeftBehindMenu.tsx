// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/i18n/LanguageContext';
import { leftBehindCopy } from '../lib/copy';
import { useLeftBehindStore } from '../state/useLeftBehindStore';
export function LeftBehindMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const { language, tr } = useLanguage();
  const copy = leftBehindCopy[language];
  const text = (value: string) => tr({ en: value, fr: value });
  const machinesVisible = useLeftBehindStore(s => s.machinesVisible);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && !ref.current?.contains(event.target) && !event.target.closest('[data-lb-menu-trigger]')) useLeftBehindStore.getState().setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') useLeftBehindStore.getState().setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return <div ref={ref} data-lb-menu role="region" aria-label={text(copy.name)} className="pd-card absolute top-12 right-2 sm:top-[68px] sm:right-4 z-[10002] w-[min(300px,calc(100vw-1rem))] bg-foreground/10 backdrop-blur-xs p-3">
    <div className="pd-hud-label border-b border-border pb-3">{text(copy.tours)}</div>
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm text-foreground">
      <span>{text(copy.machines)}</span><Switch aria-label={text(copy.machines)} checked={machinesVisible} onCheckedChange={() => useLeftBehindStore.getState().toggleMachines()} />
    </label>
    <Button variant="ghost" disabled className="w-full min-h-11 justify-start">{text(copy.signal)}</Button>
    <Button variant="ghost" disabled className="w-full min-h-11 justify-start">{text(copy.know)}</Button>
  </div>;
}