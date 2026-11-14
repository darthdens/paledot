// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSimClock } from '../state/useSimClock';
import { dateCopy, formatSimDate } from '../lib/dateCopy';
export function LeftBehindOverlay() {
  const { language, locale, tr } = useLanguage();
  const simDate = useSimClock(s => s.simDate);
  const open = useSimClock(s => s.dateControlOpen);
  return <div className="mt-1 flex justify-end lg:justify-start">
    <Button data-lb-date-chip variant="ghost" aria-expanded={open} className={`h-8 gap-2 rounded-lg px-3 backdrop-blur-md text-foreground font-mono text-[10px] tabular-nums ${open ? 'bg-foreground/25' : 'bg-foreground/10 hover:bg-foreground/20'}`} aria-label={tr({ en: dateCopy[language].date, fr: dateCopy[language].date })} onClick={() => useSimClock.getState().setDateControlOpen(!open)}><Clock className="h-3.5 w-3.5 shrink-0" /><span>{formatSimDate(simDate, locale)}</span><ChevronDown className={`h-3 w-3 shrink-0 ${open ? 'rotate-180' : ''}`} /></Button>
  </div>;
}
