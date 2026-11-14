// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSimClock } from '../state/useSimClock';
import { CLOCK_RATES, CLOCK_START, CLOCK_END } from '../engine/clock';
import { dateCopy, formatSimDate } from '../lib/dateCopy';

export function DateControl() {
  const { language, locale, tr } = useLanguage();
  const copy = dateCopy[language];
  const text = (value: string) => tr({ en: value, fr: value });
  const state = useSimClock();
  const labels = [copy.real, copy.hour, copy.day, copy.month, copy.year];
  return <div className="w-[min(320px,calc(100vw-2rem))] p-3 space-y-3 text-foreground" role="group" aria-label={text(copy.date)}>
    <div className="pd-hud-label">{text(copy.date)}</div>
    <output className="block font-mono text-xs tabular-nums">{formatSimDate(state.simDate, locale)}</output>
    <input type="datetime-local" aria-label={text(copy.date)} value={new Date(state.simDate).toISOString().slice(0, 16)} min="1957-01-01T00:00" max="2100-12-31T23:59" onChange={e => state.setSimDate(Date.parse(`${e.target.value}:00Z`))} className="w-full min-h-11 border border-border bg-transparent rounded-md px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    <div className="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" className="pd-pill min-h-11 min-w-11" aria-label={text(state.isPlaying ? copy.pause : copy.play)} title={text(state.isPlaying ? copy.pause : copy.play)} onClick={state.togglePlaying}>{state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
      <Button variant="outline" className="pd-pill min-h-11" onClick={() => state.setSimDate(Date.now())}>{text(copy.today)}</Button>
    </div>
    <div className="grid grid-cols-2 gap-1">
      {CLOCK_RATES.map((rate, i) => <Button key={rate} variant="outline" className={`pd-pill min-w-0 min-h-11 px-2 text-[11px] ${state.rate === rate ? 'pd-primary' : ''}`} aria-pressed={state.rate === rate} onClick={() => state.setRate(rate)}>{text(labels[i] ?? copy.day)}</Button>)}
    </div>
    <input type="range" aria-label={text(copy.date)} min={CLOCK_START} max={CLOCK_END} step={3600000} value={state.simDate} onChange={e => state.setSimDate(Number(e.target.value))} className="w-full h-11 accent-primary focus-visible:ring-2 focus-visible:ring-ring" />
    <div className="relative h-5 font-mono text-[8px] text-muted-foreground tabular-nums">
      {[1960,1970,1980,1990,2000,2010,2020,2030,2040,2050,2060,2070,2080,2090,2100].map(year => <span key={year} className="absolute -translate-x-1/2" style={{ left: `${(Date.UTC(year,0,1)-CLOCK_START)/(CLOCK_END-CLOCK_START)*100}%` }}>{year % 30 === 0 ? year : '·'}</span>)}
    </div>
    <p className="text-[10px] text-muted-foreground">{text(copy.source)}</p>
  </div>;
}