// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { CalendarDays, Clock, Play, Pause } from 'lucide-react';
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
  const labels = [copy.real, copy.minute, copy.hour, copy.day, copy.month, copy.year];
  return <div className="w-[min(320px,calc(100vw-2rem))] p-3 space-y-3 text-foreground" role="group" aria-label={text(copy.date)}>
    <div className="pd-hud-label">{text(copy.date)}</div>
    <output className="block font-mono text-xs tabular-nums">{formatSimDate(state.simDate, locale)}</output>
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
      <label className="min-w-0 space-y-1">
        <span className="text-[10px] text-muted-foreground">{text(copy.calendar)}</span>
        <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/30 px-2 focus-within:ring-2 focus-within:ring-ring">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input type="date" aria-label={text(copy.calendar)} value={new Date(state.simDate).toISOString().slice(0,10)} min="1957-01-01" max="2100-12-31" onChange={e => state.setSimDate(Date.parse(`${e.target.value}T${new Date(state.simDate).toISOString().slice(11,19)}Z`))} className="min-w-0 w-full bg-transparent font-mono text-[11px] tabular-nums outline-none" />
        </div>
      </label>
      <label className="min-w-0 space-y-1">
        <span className="text-[10px] text-muted-foreground">{text(copy.time)}</span>
        <div className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/30 px-2 focus-within:ring-2 focus-within:ring-ring">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input type="time" step="1" aria-label={text(copy.time)} value={new Date(state.simDate).toISOString().slice(11,19)} onChange={e => state.setSimDate(Date.parse(`${new Date(state.simDate).toISOString().slice(0,10)}T${e.target.value.length === 5 ? e.target.value + ':00' : e.target.value}Z`))} className="min-w-0 w-full bg-transparent font-mono text-[11px] tabular-nums outline-none" />
        </div>
      </label>
    </div>
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