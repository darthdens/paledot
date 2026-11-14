// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { leftBehindCopy } from '../lib/copy';
import { useLeftBehindStore } from '../state/useLeftBehindStore';

export function LeftBehindOverlay() {
  const { language, tr } = useLanguage();
  const copy = leftBehindCopy[language];
  const name = tr({ en: copy.name, fr: copy.name });
  const exit = useLeftBehindStore(s => s.exit);
  return <div className="absolute left-2 top-24 sm:left-4 sm:top-20 z-[9999] flex max-w-[calc(100%-1rem)] items-center gap-3" role="region" aria-label={name}>
    <span className="pd-hud-label" aria-live="polite">{name}</span>
    <Button variant="outline" className="pd-pill min-h-11 focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { exit(); if (window.location.hash === '#left-behind') window.history.replaceState(null, '', window.location.pathname + window.location.search); }}>
      <LogOut className="h-4 w-4" />{tr({ en: copy.exit, fr: copy.exit })}
    </Button>
  </div>;
}