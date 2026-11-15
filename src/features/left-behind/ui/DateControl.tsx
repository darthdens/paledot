// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { enGB, enUS, fr, es, pt, it, de } from 'react-day-picker/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSiteBrand } from '@/lib/site-brand';
import { useSimClock } from '../state/useSimClock';
import { CLOCK_RATES, CLOCK_START, CLOCK_END } from '../engine/clock';
import { dateCopy, formatSimDate } from '../lib/dateCopy';
import { replaceUtcDay, replaceUtcTime } from '../lib/dateEditing';

const calendarLocales = { 'en-GB': enGB, 'en-US': enUS, fr, es, pt, it, de };
const timeLabels = {
  en: ['Hours', 'Minutes', 'Seconds'], fr: ['Heures', 'Minutes', 'Secondes'],
  es: ['Horas', 'Minutos', 'Segundos'], pt: ['Horas', 'Minutos', 'Segundos'],
  it: ['Ore', 'Minuti', 'Secondi'], de: ['Stunden', 'Minuten', 'Sekunden'],
};

function TimeColumn({ part, label, value }: { part: 'hour' | 'minute' | 'second'; label: string; value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' }); }, []);
  return <div className="min-w-0"><div className="mb-2 truncate text-center text-[10px] text-muted-foreground">{label}</div>
    <div ref={ref} role="listbox" aria-label={label} className="h-[220px] overflow-y-auto overscroll-contain rounded-md border border-border p-1" onKeyDown={event => {
      if (!['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const options = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
      const focused = options.findIndex(option => option === document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, focused + (event.key === 'ArrowDown' ? 1 : -1)));
      options[next]?.focus(); options[next]?.click();
    }}>
      {Array.from({ length: part === 'hour' ? 24 : 60 }, (_, number) => <Button key={number} variant="ghost" role="option" aria-selected={number === value} tabIndex={number === value ? 0 : -1} onClick={() => useSimClock.getState().setSimDate(replaceUtcTime(useSimClock.getState().simDate, part, number))} className={`w-full min-h-11 h-11 px-0 font-mono text-sm tabular-nums ${number === value ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>{String(number).padStart(2,'0')}</Button>)}
    </div></div>;
}

export function DateControl() {
  const { language, locale, tr } = useLanguage();
  const copy = dateCopy[language];
  const text = (value: string) => tr({ en: value, fr: value });
  const state = useSimClock();
  const brand = useSiteBrand();
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const current = new Date(state.simDate);
  const calendarDate = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
  const pickerClass = `${brand === 'paledot' ? 'paledot' : ''} cosmos-clock-picker pointer-events-auto z-[10010] w-[min(340px,calc(100vw-16px))] max-h-[calc(100dvh-16px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-lg border-border bg-card p-3 text-foreground`;
  const labels = [copy.real, copy.minute, copy.hour, copy.day, copy.month, copy.year];
  return <div className="w-[min(320px,calc(100vw-2rem))] p-3 space-y-3 text-foreground" data-date-fields role="group" aria-label={text(copy.date)}>
    <div className="pd-hud-label">{text(copy.date)}</div>
    <output className="block font-mono text-xs tabular-nums">{formatSimDate(state.simDate, locale)}</output>
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0 space-y-1">
        <span className="text-[10px] text-muted-foreground">{text(copy.calendar)}</span>
        <Popover open={picker === 'date'} onOpenChange={open => setPicker(open ? 'date' : null)}>
          <PopoverTrigger asChild><Button variant="outline" aria-label={text(copy.calendar)} className="w-full min-h-11 min-w-0 justify-between gap-1 px-2 font-mono text-[11px] font-normal tabular-nums"><span className="min-w-0 truncate">{new Intl.DateTimeFormat(locale, { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' }).format(current)}</span><CalendarIcon className="shrink-0 size-4" /></Button></PopoverTrigger>
          <PopoverContent onEscapeKeyDown={event => event.stopPropagation()} align="end" sideOffset={8} collisionPadding={8} className={pickerClass} aria-label={text(copy.calendar)}>
            <Calendar mode="single" selected={calendarDate} defaultMonth={calendarDate} locale={calendarLocales[locale]} weekStartsOn={locale === 'en-US' ? 0 : 1} captionLayout="dropdown" navLayout="after" startMonth={new Date(1957,0,1)} endMonth={new Date(2100,11,31)} disabled={{ before: new Date(1957,0,1), after: new Date(2100,11,31) }} autoFocus onSelect={date => { if (date) { state.setSimDate(replaceUtcDay(useSimClock.getState().simDate, date)); setPicker(null); } }} />
          </PopoverContent>
        </Popover>
      </div>
      <div className="min-w-0 space-y-1">
        <span className="text-[10px] text-muted-foreground">{text(copy.time)}</span>
        <Popover open={picker === 'time'} onOpenChange={open => setPicker(open ? 'time' : null)}>
          <PopoverTrigger asChild><Button variant="outline" aria-label={text(copy.time)} className="w-full min-h-11 min-w-0 justify-between gap-1 px-2 font-mono text-[11px] font-normal tabular-nums"><span>{current.toISOString().slice(11,19)}</span><Clock className="shrink-0 size-4" /></Button></PopoverTrigger>
          <PopoverContent onEscapeKeyDown={event => event.stopPropagation()} align="end" sideOffset={8} collisionPadding={8} className={pickerClass} aria-label={text(copy.time)}>
            <div className="pd-hud-label mb-3">{text(copy.time)}</div>
            <div className="grid grid-cols-3 gap-2">
              {(['hour','minute','second'] as const).map((part, i) => <TimeColumn key={part} part={part} label={timeLabels[language][i] ?? ''} value={part === 'hour' ? current.getUTCHours() : part === 'minute' ? current.getUTCMinutes() : current.getUTCSeconds()} />)}
            </div>
          </PopoverContent>
        </Popover>
      </div>
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