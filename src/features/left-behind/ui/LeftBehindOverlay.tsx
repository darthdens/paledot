// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSimClock } from '../state/useSimClock';
import { dateCopy, formatSimDate } from '../lib/dateCopy';
export function LeftBehindOverlay() {
  const { language, locale, tr } = useLanguage();
  const simDate = useSimClock(s => s.simDate);
  return <div className="absolute left-2 top-[132px] sm:left-4 sm:top-[120px] z-[9999]">
    <Button data-lb-date-chip variant="ghost" className="pd-pill min-h-11 px-2 bg-foreground/10 backdrop-blur-xs text-foreground font-mono text-[10px] tabular-nums" aria-label={tr({ en: dateCopy[language].date, fr: dateCopy[language].date })} onClick={() => useSimClock.getState().setDateControlOpen(true)}>{formatSimDate(simDate, locale)}</Button>
  </div>;
}
