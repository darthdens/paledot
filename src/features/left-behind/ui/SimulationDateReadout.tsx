// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCosmosStore } from '@/components/cosmos/store/useCosmosStore';
import { tickSimulationClock } from '../engine/clockDriver';
import { useSimClock } from '../state/useSimClock';
import { dateCopy, formatSimDate } from '../lib/dateCopy';

export function SimulationDateReadout() {
  useEffect(() => {
    const tick = () => {
      const tour = useCosmosStore.getState();
      tickSimulationClock(Date.now(), tour.isTouring && tour.isPaused);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, []);
  const { language, locale } = useLanguage();
  const second = useSimClock(state => Math.floor(state.simDate / 1000));
  return (
    <div className="paledot dark pointer-events-none fixed inset-x-0 top-0 z-[2147483647] flex h-[calc(1.5rem+env(safe-area-inset-top))] items-end justify-center bg-background" data-simulation-readout>
      <time
        dateTime={new Date(second * 1000).toISOString()}
        aria-label={dateCopy[language].date}
        className="h-6 whitespace-nowrap font-mono text-[11px] leading-6 tracking-normal tabular-nums text-foreground"
      >
        {formatSimDate(second * 1000, locale)}
      </time>
    </div>
  );
}