// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Radio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { getHardware, getTrajectory } from '../data/dataClient';
import { useSignal } from '../state/useSignal';
import { signalCopy } from '../lib/signalCopy';
import { dataText } from '../lib/dataText';
import { buildSignalRace, countdown, LIGHT_KM_S, lightSeconds, logDistance, remainingSeconds, restoreRace, saveRace, shortMessage, signalProgress, type SignalMachine, type SignalRace, type SignalRow } from '../lib/signal';
import type { Trajectory } from '../data/types';
import { LeftBehindDialogContent, LeftBehindDialogOverlay } from './DialogSurface';
export function SendSignal() {
  const { language, numberLocale, tr } = useLanguage();
  const c = signalCopy[language];
  const T = (s: string) => tr({ en: s, fr: s });
  const open = useSignal(s => s.open), race = useSignal(s => s.race), target = useSignal(s => s.targetId);
  const [data, setData] = useState<{ machines: SignalMachine[]; tracks: Trajectory[]; dsn: string; reflector: string } | null>(null);
  const [preview, setPreview] = useState<SignalRace | null>(null);
  const [now, setNow] = useState(0), [minute, setMinute] = useState(0);
  const [message, setMessage] = useState(''), [failed, setFailed] = useState(false), [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => { try { const saved = restoreRace(window.localStorage); if (saved) useSignal.getState().setRace(saved); } catch { /* Storage unavailable. */ } }, []);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFailed(false);
    void Promise.all([getHardware(), getTrajectory('voyager-1'), getTrajectory('voyager-2')]).then(([hardware, v1, v2]) => {
      if (!alive) return;
      const h = hardware as typeof hardware & { shared?: { facts: { id: string; sourceUrl: string }[] } };
      const machines = hardware.machines as SignalMachine[];
      const ready = { machines, tracks: [v1, v2], dsn: h.shared?.facts.find(f => f.id === 'dsn')?.sourceUrl ?? '', reflector: machines.find(m => m.id === 'apollo-11')?.facts?.find(f => f.id === 'a11-light-return')?.sourceUrl ?? '' };
      setData(ready); setPreview(buildSignalRace(ready.machines, ready.tracks, Date.now(), ''));
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const tick = () => { const t = Date.now(); setNow(t); setMinute(Math.floor(t / 60000)); };
    tick(); const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [open]);
  useEffect(() => { if (open && data && !race) { try { setPreview(buildSignalRace(data.machines, data.tracks, Date.now(), '')); } catch { setFailed(true); } } }, [minute, open, data, race]);
  const view = race ?? preview;
  const maxKm = Math.max(...(view?.rows.map(r => r.distanceKm) ?? [1]));
  const fmt = (n: number) => new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(n);
  const date = (t: number) => new Date(t).toLocaleString(numberLocale, { timeZone: 'UTC' }) + ' UTC';
  const status = (row: SignalRow, time: number) => {
    const remaining = race ? remainingSeconds(race, row, time) : lightSeconds(row.distanceKm);
    if (!race) return c.ready.replace('{t}', countdown(remaining));
    if (remaining > 0) return c.arrives.replace('{t}', countdown(remaining));
    if (row.status === 'in-use') return c.reflector;
    if (row.status === 'silent') return row.since ? c.silent.replace('{d}', new Date(`${row.since}-01T00:00:00Z`).toLocaleDateString(numberLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' })) : 'TODO(source)';
    return c.arrived;
  };
  const persist = (value: SignalRace | null) => {
    useSignal.getState().setRace(value); setStorageFailed(false);
    try { saveRace(value, window.localStorage); if (value && !restoreRace(window.localStorage)) setStorageFailed(true); } catch { setStorageFailed(true); }
  };
  return <DialogPrimitive.Root open={open} onOpenChange={o => !o && useSignal.getState().close()}>
    <DialogPrimitive.Portal>
      <LeftBehindDialogOverlay />
      <LeftBehindDialogContent data-signal-view>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-2">
          <DialogPrimitive.Title className="pl-2 text-sm font-semibold">{T(c.title)}</DialogPrimitive.Title>
          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label={T(c.close)} onClick={() => useSignal.getState().close()}><X className="h-4 w-4" /></Button>
        </header>
        <div className="overflow-y-auto overscroll-contain p-4 space-y-4">
          <DialogPrimitive.Description className="text-xs text-muted-foreground">{T(c.now)}<span className="block font-mono tabular-nums">{view ? date(view.sentAt) : ''}</span></DialogPrimitive.Description>
          <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); if (data && !race) { try { persist(buildSignalRace(data.machines, data.tracks, Date.now(), message)); } catch { setFailed(true); } } }}>
            <div className="min-w-0 flex-1"><label htmlFor="signal-message" className="block mb-2 text-xs text-muted-foreground">{T(c.message)}</label><Input id="signal-message" value={race?.message ?? message} maxLength={40} disabled={!!race} onChange={e => setMessage(shortMessage(e.target.value))} className="h-11 bg-muted/30" /></div>
            <Button type="submit" variant="ghost" disabled={!!race || !data || failed} className="h-11 gap-2 border border-border bg-muted/50"><Radio className="h-4 w-4" />{T(c.send)}</Button>
          </form>
          {race && <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{c.sent.replace('{d}', date(race.sentAt))}</span><Button variant="link" className="h-11 p-0 text-muted-foreground underline" onClick={() => { persist(null); setMessage(''); }}>{T(c.reset)}</Button></div>}
          <p className="font-mono text-[11px] uppercase text-muted-foreground">{T(c.scale)}<span className="block normal-case">{race ? T(c.snapshot) : T(c.speed)}</span></p>
          {failed ? <p role="alert" className="text-sm text-muted-foreground">{T(c.unavailable)}</p> : !view ? <p className="text-sm text-muted-foreground">{T(c.loading)}</p> : <ul className="divide-y divide-border">
            {view.rows.map(row => {
              const progress = race ? signalProgress(race, row, now) : 0;
              const extent = logDistance(row.distanceKm, maxKm);
              const lightKm = race ? Math.min(row.distanceKm, Math.max(0, now - race.sentAt) / 1000 * LIGHT_KM_S) : 0;
              return <li key={row.id} data-signal-row={row.id} className="py-3 first:pt-0 last:pb-0">
                <Button variant="ghost" aria-pressed={row.id === target} className={`h-auto min-h-11 w-full justify-start whitespace-normal px-0 py-1 text-left text-sm ${row.id === target ? 'text-primary' : 'text-foreground'}`} onClick={() => useSignal.setState({ targetId: row.id })}>{dataText(row.name, language)}</Button>
                <p className="font-mono tabular-nums text-xs">{fmt(row.distanceKm)} km</p>
                <p className="text-[10px] text-muted-foreground"><a target="_blank" rel="noopener noreferrer" className="hover:underline" href={row.provenance === 'ephemeris' ? 'https://github.com/cosinekitty/astronomy' : 'https://ssd.jpl.nasa.gov/horizons/'}>{row.provenance === 'ephemeris' ? T(c.ephemeris) : row.extrapolated ? T(c.extrapolated) : T(c.horizons)}</a></p>
                <div className="relative mt-2 h-1 bg-muted/30" aria-hidden><span className="absolute left-0 top-0 h-1 bg-muted-foreground/40" style={{ width: `${extent * 100}%` }} /><span className="absolute left-0 top-0 h-1 bg-primary" style={{ width: `${logDistance(lightKm, maxKm) * 100}%` }} /></div>
                <div className="mt-2 text-[11px] text-muted-foreground" role="progressbar" aria-label={dataText(row.name, language)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span className="font-mono tabular-nums" data-signal-countdown>{status(row, now)}</span></div>
                {race && row.status === 'in-use' && remainingSeconds(race, row, now) === 0 && <p className="text-xs text-muted-foreground"><a href={data?.reflector} target="_blank" rel="noopener noreferrer" className="block hover:underline">NASA · NTRS</a>{c.roundTrip.replace('{t}', `${new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 2 }).format(2 * lightSeconds(row.distanceKm))} s`)}</p>}
                {row.status === 'transmitting' && <p className="mt-1 text-xs text-muted-foreground">{c.reply.replace('{t}', countdown(race ? Math.max(0, lightSeconds(row.distanceKm) * 2 - (now - race.sentAt) / 1000) : lightSeconds(row.distanceKm) * 2))}<a href={data?.dsn} target="_blank" rel="noopener noreferrer" className="block hover:underline">{T(c.network)}</a></p>}
              </li>;
            })}
          </ul>}
          <p className="text-xs text-muted-foreground">{T(c.pulse)}</p>
          {storageFailed && <p role="alert" className="text-xs text-muted-foreground">{T(c.storage)}</p>}
          <p className="sr-only" aria-live="polite" aria-atomic="true">{view?.rows.map(row => `${dataText(row.name, language)}: ${status(row, Math.max(view.sentAt, minute * 60000))}`).join('. ')}</p>
        </div>
        <footer className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">{T(c.simulation)}</footer>
      </LeftBehindDialogContent>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
